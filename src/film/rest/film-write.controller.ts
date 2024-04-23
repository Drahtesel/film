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

        const location = `${getBaseUri(req)}${id}`;
        this.#logger.debug('post: location=%s', location);
        return res.location(location).send();
    }

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
                .status(HttpStatus.PRECONDITION_FAILED)
                .set('Content-Type', 'application/json')
                .send(msg);
        }

        const film = this.#filmDtoOhneRefTofilm(filmDTO);
        const neueVersion = await this.#service.update({ id, film, version });
        this.#logger.debug('put: version=%d', neueVersion);
        return res.header('ETag', `"${neueVersion}"`).send();
    }

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
            art: filmDTO.art,
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
            art: filmDTO.art,
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
