/*
 * Copyright (C) 2016 - present Juergen Zimmermann, Hochschule Karlsruhe
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

/**
 * Das Modul besteht aus der Klasse {@linkcode FilmWriteService} für die
 * Schreiboperationen im Anwendungskern.
 * @packageDocumentation
 */

import { type DeleteResult, Repository } from 'typeorm';
import { Injectable, NotFoundException } from '@nestjs/common';
import {
    IsbnExistsException,
    VersionInvalidException,
    VersionOutdatedException,
} from './exceptions.js';
import { Schauspieler } from '../entity/schauspieler.entity.js';
import { Distributor } from '../entity/distributor.entity.js';
import { Film } from '../entity/film.entity.js';
import { FilmReadService } from './film-read.service.js';
import { InjectRepository } from '@nestjs/typeorm';
import { MailService } from '../../mail/mail.service.js';
import { getLogger } from '../../logger/logger.js';
import { Distributor } from '../entity/distributor.entity';

/** Typdefinitionen zum Aktualisieren eines Buches mit `update`. */
export interface UpdateParams {
    /** ID des zu aktualisierenden Buches. */
    readonly id: number | undefined;
    /** Buch-Objekt mit den aktualisierten Werten. */
    readonly film: Film;
    /** Versionsnummer für die aktualisierenden Werte. */
    readonly version: string;
}

/**
 * Die Klasse `BuchWriteService` implementiert den Anwendungskern für das
 * Schreiben von Bücher und greift mit _TypeORM_ auf die DB zu.
 */
@Injectable()
export class FilmWriteService {
    private static readonly VERSION_PATTERN = /^"\d{1,3}"/u;

    readonly #repo: Repository<Film>;

    readonly #readService: FilmReadService;

    readonly #mailService: MailService;

    readonly #logger = getLogger(FilmWriteService.name);

    constructor(
        @InjectRepository(Film) repo: Repository<Film>,
        readService: FilmReadService,
        mailService: MailService,
    ) {
        this.#repo = repo;
        this.#readService = readService;
        this.#mailService = mailService;
    }

    /**
     * Ein neues Buch soll angelegt werden.
     * @param film Das neu abzulegende Buch
     * @returns Die ID des neu angelegten Buches
     * @throws IsbnExists falls die ISBN-Nummer bereits existiert
     */
    async create(film: Film): Promise<number> {
        this.#logger.debug('create: buch=%o', film);
        await this.#validateCreate(film);

        const filmDb = await this.#repo.save(film); // implizite Transaktion
        this.#logger.debug('create: buchDb=%o', filmDb);

        await this.#sendmail(filmDb);

        return filmDb.id!;
    }

    /**
     * Ein vorhandenes Buch soll aktualisiert werden. "Destructured" Argument
     * mit id (ID des zu aktualisierenden Buchs), buch (zu aktualisierendes Buch)
     * und version (Versionsnummer für optimistische Synchronisation).
     * @returns Die neue Versionsnummer gemäß optimistischer Synchronisation
     * @throws NotFoundException falls kein Buch zur ID vorhanden ist
     * @throws VersionInvalidException falls die Versionsnummer ungültig ist
     * @throws VersionOutdatedException falls die Versionsnummer veraltet ist
     */
    // https://2ality.com/2015/01/es6-destructuring.html#simulating-named-parameters-in-javascript
    async update({ id, film: film, version }: UpdateParams): Promise<number> {
        this.#logger.debug(
            'update: id=%d, buch=%o, version=%s',
            id,
            film,
            version,
        );
        if (id === undefined) {
            this.#logger.debug('update: Keine gueltige ID');
            throw new NotFoundException(`Es gibt kein Buch mit der ID ${id}.`);
        }

        const validateResult = await this.#validateUpdate(film, id, version);
        this.#logger.debug('update: validateResult=%o', validateResult);
        if (!(validateResult instanceof Film)) {
            return validateResult;
        }

        const filmNeu = validateResult;
        const merged = this.#repo.merge(filmNeu, film);
        this.#logger.debug('update: merged=%o', merged);
        const updated = await this.#repo.save(merged); // implizite Transaktion
        this.#logger.debug('update: updated=%o', updated);

        return updated.version!;
    }

    /**
     * Ein Buch wird asynchron anhand seiner ID gelöscht.
     *
     * @param id ID des zu löschenden Buches
     * @returns true, falls das Buch vorhanden war und gelöscht wurde. Sonst false.
     */
    async delete(id: number) {
        this.#logger.debug('delete: id=%d', id);
        const film = await this.#readService.findById({
            id,
            mitSchauspielerinnen: true,
        });

        let deleteResult: DeleteResult | undefined;
        await this.#repo.manager.transaction(async (transactionalMgr) => {
            // Das Buch zur gegebenen ID mit Titel und Abb. asynchron loeschen

            // TODO "cascade" funktioniert nicht beim Loeschen
            const distributorId = film.distributor?.id;
            if (distributorId !== undefined) {
                await transactionalMgr.delete(Distributor, distributorId);
            }
            const schauspielerinnen = film.schauspielerinnen ?? [];
            for (const schauspieler of schauspielerinnen) {
                await transactionalMgr.delete(Schauspieler, schauspieler.id);
            }

            deleteResult = await transactionalMgr.delete(Film, id);
            this.#logger.debug('delete: deleteResult=%o', deleteResult);
        });

        return (
            deleteResult?.affected !== undefined &&
            deleteResult.affected !== null &&
            deleteResult.affected > 0
        );
    }

    async #validateCreate({ isbn }: Film): Promise<undefined> {
        this.#logger.debug('#validateCreate: isbn=%s', isbn);
        if (await this.#repo.existsBy({ isbn })) {
            throw new IsbnExistsException(isbn);
        }
    }

    async #sendmail(film: Film) {
        const subject = `Neues Buch ${film.id}`;
        const distributor = film.distributor?.distributor ?? 'N/A';
        const body = `Das Buch mit dem Titel <strong>${distributor}</strong> ist angelegt`;
        await this.#mailService.sendmail({ subject, body });
    }

    async #validateUpdate(
        film: Film,
        id: number,
        versionStr: string,
    ): Promise<Film> {
        this.#logger.debug(
            '#validateUpdate: buch=%o, id=%s, versionStr=%s',
            film,
            id,
            versionStr,
        );
        if (!FilmWriteService.VERSION_PATTERN.test(versionStr)) {
            throw new VersionInvalidException(versionStr);
        }

        const version = Number.parseInt(versionStr.slice(1, -1), 10);
        this.#logger.debug(
            '#validateUpdate: buch=%o, version=%d',
            film,
            version,
        );

        const filmDb = await this.#readService.findById({ id });

        // nullish coalescing
        const versionDb = filmDb.version!;
        if (version < versionDb) {
            this.#logger.debug('#validateUpdate: versionDb=%d', version);
            throw new VersionOutdatedException(version);
        }
        this.#logger.debug('#validateUpdate: buchDb=%o', filmDb);
        return filmDb;
    }
}
