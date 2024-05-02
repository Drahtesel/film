/**
 * Das Modul besteht aus der Controller-Klasse für Schreiben an der REST-Schnittstelle.
 * @packageDocumentation
 */

import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiCreatedResponse,
    ApiForbiddenResponse,
    ApiHeader,
    ApiNoContentResponse,
    ApiOperation,
    ApiPreconditionFailedResponse,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { AuthGuard, Roles } from 'nest-keycloak-connect';
import {
    Body,
    Controller,
    Delete,
    Headers,
    HttpCode,
    HttpStatus,
    Param,
    Post,
    Put,
    Req,
    Res,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { FilmDTO, FilmDtoOhneRef } from './filmDTO.entity.js';
import { Request, Response } from 'express';
import { type Distributor } from '../entity/distributor.entity.js';

import { type Film } from '../entity/film.entity.js';
import { FilmWriteService } from '../service/film-write.service.js';
import { ResponseTimeInterceptor } from '../../logger/response-time.interceptor.js';
import { type Schauspieler } from '../entity/schauspieler.entity.js';
import { getBaseUri } from './getBaseUri.js';
import { getLogger } from '../../logger/logger.js';
import { paths } from '../../config/paths.js';

const MSG_FORBIDDEN = 'Kein Token mit ausreichender Berechtigung vorhanden';

/**
 * Die Controllerklasse für die Verwaltung von Filmen
 */
@Controller(paths.rest)
@UseGuards(AuthGuard)
@UseInterceptors(ResponseTimeInterceptor)
@ApiTags('Film REST-API')
@ApiBearerAuth()
export class FilmWriteController {
    readonly #service: FilmWriteService;

    readonly #logger = getLogger(FilmWriteController.name);

    constructor(service: FilmWriteService) {
        this.#service = service;
    }

    /**
     * Ein neuer Film wird asynchron angelegt. Der neu anzulegende Filme ist als
     * JSON-Datensatz im Request-Objekt enthalten. Wenn es keine
     * Verletzungen von Constraints gibt, wird der Statuscode `201` (`Created`)
     * gesetzt und im Response-Header wird `Location` auf die URI so gesetzt,
     * dass damit der neu angelegte Film abgerufen werden kann.
     *
     * Falls Constraints verletzt sind, wird der Statuscode `400` (`Bad Request`)
     * gesetzt und genauso auch wenn die Kombination aus Titel und Erscheinungsdatum bereits
     * existiert.
     *
     * @param filmDTO JSON-Daten für ein Film im Request-Body.
     * @param res Leeres Response-Objekt von Express.
     * @returns Leeres Promise-Objekt.
     */

    @Post()
    @Roles({ roles: ['admin', 'user'] })
    @ApiOperation({ summary: 'Einen neuen Film anlegen' })
    @ApiCreatedResponse({ description: 'Erfolgreich neu angelegt' })
    @ApiBadRequestResponse({ description: 'Feherhafte Daten' })
    @ApiForbiddenResponse({ description: MSG_FORBIDDEN })
    async post(
        @Body() filmDTO: FilmDTO,
        @Req() req: Request,
        @Res() res: Response,
    ): Promise<Response> {
        this.#logger.debug('post: filmDTO=%o', filmDTO);

        const film = this.#filmDtoTofilm(filmDTO);
        const id = await this.#service.create(film);

        const location = `${getBaseUri(req)}/${id}`;
        this.#logger.debug('post: location=%s', location);
        return res.location(location).send();
    }

    /**
     * Ein vorhandener Film wird asynchron aktualisiert.
     *
     * Im Request-Objekt von Express muss die ID des zu aktualisierenden Films
     * als Pfad-Parameter enthalten sein. Außerdem muss im Rumpf der zu
     * aktualisierende Film als JSON-Datensatz enthalten sein. Damit die
     * Aktualisierung überhaupt durchgeführt werden kann, muss im Header
     * `If-Match` auf die korrekte Version für optimistische Synchronisation
     * gesetzt sein.
     *
     * Bei erfolgreicher Aktualisierung wird der Statuscode `204` (`No Content`)
     * gesetzt und im Header auch `ETag` mit der neuen Version mitgeliefert.
     *
     * Falls die Versionsnummer fehlt, wird der Statuscode `428` (`Precondition
     * required`) gesetzt; und falls sie nicht korrekt ist, der Statuscode `412`
     * (`Precondition failed`). Falls Constraints verletzt sind, wird der
     * Statuscode `400` (`Bad Request`) gesetzt und genauso auch wenn die
     * Kombination aus Titel und Erscheinungsdatum bereits existieret.
     *
     * @param filmDTO Filmdaten im Body des Request-Objekts.
     * @param id Pfad-Paramater für die ID.
     * @param version Versionsnummer aus dem Header _If-Match_.
     * @param res Leeres Response-Objekt von Express.
     * @returns Leeres Promise-Objekt.
     */

    // eslint-disable-next-line max-params
    @Put(':id')
    @Roles({ roles: ['admin', 'user'] })
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({
        summary: 'Einen Film aktualisieren',
        tags: ['Aktualisieren'],
    })
    @ApiHeader({
        name: 'If-Match',
        description: 'Header für optimistische Synchronisation',
        required: false,
    })
    @ApiNoContentResponse({ description: 'Erfolgreich aktualisiert' })
    @ApiBadRequestResponse({ description: 'Fehlerhafte Daten' })
    @ApiPreconditionFailedResponse({
        description: 'Version stimmt nicht überein',
    })
    @ApiResponse({
        status: HttpStatus.PRECONDITION_FAILED,
        description: 'Header "If-Match" fehlt',
    })
    @ApiForbiddenResponse({ description: MSG_FORBIDDEN })
    async put(
        @Body() filmDTO: FilmDtoOhneRef,
        @Param('id') id: number,
        @Headers('If-Match') version: string | undefined,
        @Res() res: Response,
    ): Promise<Response> {
        this.#logger.debug(
            'put: id=%s, filmDTO=%o, version=%s',
            id,
            filmDTO,
            version,
        );

        if (version === undefined) {
            const msg = 'Header "If-Match" fehlt';
            this.#logger.debug('put: msg=%s', msg);
            return res
                .status(HttpStatus.PRECONDITION_REQUIRED)
                .set('Content-Type', 'application/json')
                .send(msg);
        }

        const film = this.#filmDtoOhneRefTofilm(filmDTO);
        const neueVersion = await this.#service.update({ id, film, version });
        this.#logger.debug('put: version=%d', neueVersion);
        return res.header('ETag', `"${neueVersion}"`).send();
    }

    /**
     * Ein Film wird anhand seiner ID-gelöscht, die als Pfad-Parameter angegeben
     * ist. Der zurückgelieferte Statuscode ist `204` (`No Content`).
     *
     * @param id Pfad-Paramater für die ID.
     * @returns Leeres Promise-Objekt.
     */
    @Delete(':id')
    @Roles({ roles: ['admin'] })
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Einen Film anhand der ID löschen' })
    @ApiNoContentResponse({
        description: 'Der Film wurde gelöscht, oder wurde nicht gefunden',
    })
    @ApiForbiddenResponse({ description: MSG_FORBIDDEN })
    async delete(@Param('id') id: number) {
        this.#logger.debug('delete: id=%s', id);
        await this.#service.delete(id);
    }

    #filmDtoTofilm(filmDTO: FilmDTO): Film {
        const distributorDTO = filmDTO.distributor;
        const distributor: Distributor = {
            id: undefined,
            name: distributorDTO.name,
            homepage: distributorDTO.homepage,
            umsatz: distributorDTO.umsatz,
            film: undefined,
        };
        const schauspielerPl = filmDTO.schauspielerListe?.map(
            (schauspielerDTO) => {
                const schauspieler: Schauspieler = {
                    id: undefined,
                    name: schauspielerDTO.name,
                    geburtsdatum: schauspielerDTO.geburtsdatum,
                    film: undefined,
                };
                return schauspieler;
            },
        );
        const film = {
            id: undefined,
            version: undefined,
            titel: filmDTO.titel,
            rating: filmDTO.rating,
            filmart: filmDTO.filmart,
            laenge: filmDTO.laenge,
            preis: filmDTO.preis,
            rabatt: filmDTO.rabatt,
            streambar: filmDTO.streambar,
            erscheinungsdatum: filmDTO.erscheinungsdatum,
            schlagwoerter: filmDTO.schlagwoerter,
            distributor,
            schauspielerListe: schauspielerPl,
            erzeugt: new Date(),
            aktualisiert: new Date(),
        };

        // Rueckwaertsverweise
        film.distributor = distributor;
        film.schauspielerListe?.forEach((schauspieler) => {
            schauspieler.film = film;
        });
        return film;
    }

    #filmDtoOhneRefTofilm(filmDTO: FilmDtoOhneRef): Film {
        return {
            id: undefined,
            version: undefined,
            titel: filmDTO.titel,
            rating: filmDTO.rating,
            filmart: filmDTO.filmart,
            laenge: filmDTO.laenge,
            preis: filmDTO.preis,
            rabatt: filmDTO.rabatt,
            streambar: filmDTO.streambar,
            erscheinungsdatum: filmDTO.erscheinungsdatum,
            schlagwoerter: filmDTO.schlagwoerter,
            distributor: undefined,
            schauspielerListe: undefined,
            erzeugt: undefined,
            aktualisiert: new Date(),
        };
    }
}
