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
 * Das Modul besteht aus der Klasse {@linkcode QueryBuilder}.
 * @packageDocumentation
 */

import { Schauspieler } from '../entity/schauspieler.entity.js';
import { Buch as Film } from '../entity/buch.entity.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { type Suchkriterien } from './suchkriterien.js';
import { Titel } from '../entity/titel.entity.js';
import { getLogger } from '../../logger/logger.js';
import { typeOrmModuleOptions } from '../../config/typeormOptions.js';

/** Typdefinitionen für die Suche mit der Buch-ID. */
export interface BuildIdParams {
    /** ID des gesuchten Buchs. */
    readonly id: number;
    /** Sollen die Abbildungen mitgeladen werden? */
    readonly mitSchauspielerinnen?: boolean;
}
/**
 * Die Klasse `QueryBuilder` implementiert das Lesen für Bücher und greift
 * mit _TypeORM_ auf eine relationale DB zu.
 */
@Injectable()
export class QueryBuilder {
    readonly #filmAlias = `${Film.titel
        .charAt(0)
        .toLowerCase()}${Film.titel.slice(1)}`;

    readonly #distributorAlias = `${Distributor.name
        .charAt(0)
        .toLowerCase()}${Distributor.name.slice(1)}`;

    readonly #schauspielerAlias = `${Schauspieler.name
        .charAt(0)
        .toLowerCase()}${Schauspieler.name.slice(1)}`;

    readonly #repo: Repository<Film>;

    readonly #logger = getLogger(QueryBuilder.name);

    constructor(@InjectRepository(Film) repo: Repository<Film>) {
        this.#repo = repo;
    }

    /**
     * Ein Buch mit der ID suchen.
     * @param id ID des gesuchten Buches
     * @returns QueryBuilder
     */
    buildId({ id, mitSchauspielerinnen = false }: BuildIdParams) {
        // QueryBuilder "buch" fuer Repository<Buch>
        const queryBuilder = this.#repo.createQueryBuilder(this.#filmAlias);

        // Fetch-Join: aus QueryBuilder "buch" die Property "titel" ->  Tabelle "titel"
        queryBuilder.innerJoinAndSelect(
            `${this.#filmAlias}.titel`,
            this.#distributorAlias,
        );

        if (mitSchauspielerinnen) {
            // Fetch-Join: aus QueryBuilder "buch" die Property "abbildungen" -> Tabelle "abbildung"
            queryBuilder.leftJoinAndSelect(
                `${this.#filmAlias}.abbildungen`,
                this.#schauspielerAlias,
            );
        }

        queryBuilder.where(`${this.#filmAlias}.id = :id`, { id: id }); // eslint-disable-line object-shorthand
        return queryBuilder;
    }

    /**
     * Bücher asynchron suchen.
     * @param suchkriterien JSON-Objekt mit Suchkriterien
     * @returns QueryBuilder
     */
    // z.B. { titel: 'a', rating: 5, javascript: true }
    // "rest properties" fuer anfaengliche WHERE-Klausel: ab ES 2018 https://github.com/tc39/proposal-object-rest-spread
    // eslint-disable-next-line max-lines-per-function
    build({ titel, javascript, typescript, ...props }: Suchkriterien) {
        this.#logger.debug(
            'build: titel=%s, javascript=%s, typescript=%s, props=%o',
            titel,
            javascript,
            typescript,
            props,
        );

        let queryBuilder = this.#repo.createQueryBuilder(this.#filmAlias);
        queryBuilder.innerJoinAndSelect(`${this.#filmAlias}.titel`, 'titel');

        // z.B. { titel: 'a', rating: 5, javascript: true }
        // "rest properties" fuer anfaengliche WHERE-Klausel: ab ES 2018 https://github.com/tc39/proposal-object-rest-spread
        // type-coverage:ignore-next-line
        // const { titel, javascript, typescript, ...props } = suchkriterien;

        let useWhere = true;

        // Titel in der Query: Teilstring des Titels und "case insensitive"
        // CAVEAT: MySQL hat keinen Vergleich mit "case insensitive"
        // type-coverage:ignore-next-line
        if (titel !== undefined && typeof titel === 'string') {
            const ilike =
                typeOrmModuleOptions.type === 'postgres' ? 'ilike' : 'like';
            queryBuilder = queryBuilder.where(
                `${this.#distributorAlias}.titel ${ilike} :titel`,
                { titel: `%${titel}%` },
            );
            useWhere = false;
        }

        if (javascript === 'true') {
            queryBuilder = useWhere
                ? queryBuilder.where(
                      `${this.#filmAlias}.schlagwoerter like '%JAVASCRIPT%'`,
                  )
                : queryBuilder.andWhere(
                      `${this.#filmAlias}.schlagwoerter like '%JAVASCRIPT%'`,
                  );
            useWhere = false;
        }

        if (typescript === 'true') {
            queryBuilder = useWhere
                ? queryBuilder.where(
                      `${this.#filmAlias}.schlagwoerter like '%TYPESCRIPT%'`,
                  )
                : queryBuilder.andWhere(
                      `${this.#filmAlias}.schlagwoerter like '%TYPESCRIPT%'`,
                  );
            useWhere = false;
        }

        // Restliche Properties als Key-Value-Paare: Vergleiche auf Gleichheit
        Object.keys(props).forEach((key) => {
            const param: Record<string, any> = {};
            param[key] = (props as Record<string, any>)[key]; // eslint-disable-line @typescript-eslint/no-unsafe-assignment, security/detect-object-injection
            queryBuilder = useWhere
                ? queryBuilder.where(
                      `${this.#filmAlias}.${key} = :${key}`,
                      param,
                  )
                : queryBuilder.andWhere(
                      `${this.#filmAlias}.${key} = :${key}`,
                      param,
                  );
            useWhere = false;
        });

        this.#logger.debug('build: sql=%s', queryBuilder.getSql());
        return queryBuilder;
    }
}