/* eslint-disable no-underscore-dangle */
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
import {
    type FilmModel,
    type FilmeModel,
} from '../../src/film/rest/film-get.controller.js';
import { afterAll, beforeAll, describe, test } from '@jest/globals';
import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import {
    host,
    httpsAgent,
    port,
    shutdownServer,
    startServer,
} from '../testserver.js';
import { type ErrorResponse } from './error-response.js';
import { HttpStatus } from '@nestjs/common';
import { dbType } from '../../src/config/db.js';

// -----------------------------------------------------------------------------
// T e s t d a t e n
// -----------------------------------------------------------------------------
const distributorVorhanden = 'a';
const distributorNichtVorhanden = 'xx';
const schlagwortVorhanden = 'action';
const schlagwortNichtVorhanden = 'fehler';
const streambar = dbType === 'sqlite' ? '1' : 'true';

const keyValuePairs: [string, string][] = [
    ['titel', 'Star Trek Wars'],
    ['rating', '4'],
    ['laenge', '120'],
    ['filmart', 'ORIGINAL'],
    ['preis', '73.3'],
    ['rabatt', '0.017'],
    ['streambar', streambar],
    ['erscheinungsdatum', '2008-02-06'],
];

const paramsMap = new Map<string, string>(keyValuePairs);

// -----------------------------------------------------------------------------
// T e s t s
// -----------------------------------------------------------------------------
// Test-Suite
// eslint-disable-next-line max-lines-per-function
describe('GET /rest', () => {
    let baseURL: string;
    let client: AxiosInstance;

    beforeAll(async () => {
        await startServer();
        baseURL = `https://${host}:${port}/rest`;
        client = axios.create({
            baseURL,
            httpsAgent,
            validateStatus: () => true,
        });
    });

    afterAll(async () => {
        await shutdownServer();
    });

    test('Alle Filme', async () => {
        // given

        // when
        const { status, headers, data }: AxiosResponse<FilmeModel> =
            await client.get('/');

        // then
        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu); // eslint-disable-line sonarjs/no-duplicate-string
        expect(data).toBeDefined();

        const { filme } = data._embedded;

        filme
            .map((film) => film._links.self.href)
            .forEach((selfLink) => {
                // eslint-disable-next-line security/detect-non-literal-regexp, security-node/non-literal-reg-expr
                expect(selfLink).toMatch(new RegExp(`^${baseURL}`, 'iu'));
            });
    });

    test('Filme mit einem Teil-Distributorname suchen', async () => {
        // given
        const params = { distributor: distributorVorhanden };

        // when
        const { status, headers, data }: AxiosResponse<FilmeModel> =
            await client.get('/', { params });

        // then
        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data).toBeDefined();

        const { filme } = data._embedded;

        // Jedes Filme hat einen Distributor mit dem Teilstring 'a'
        filme
            .map((film) => film.distributor)
            .forEach((distributor) =>
                expect(distributor.name.toLowerCase()).toEqual(
                    expect.stringContaining(distributorVorhanden),
                ),
            );
    });

    test('Filme zu einem nicht vorhandenen Teil-Distributorname suchen', async () => {
        // given
        const params = { distributor: distributorNichtVorhanden };

        // when
        const { status, data }: AxiosResponse<ErrorResponse> = await client.get(
            '/',
            { params },
        );

        // then
        expect(status).toBe(HttpStatus.NOT_FOUND);

        const { error, statusCode } = data;

        expect(error).toBe('Not Found');
        expect(statusCode).toBe(HttpStatus.NOT_FOUND);
    });

    test('Mind. 1 Film mit vorhandenem Schlagwort', async () => {
        // given
        const params = { [schlagwortVorhanden]: 'true' };

        // when
        const { status, headers, data }: AxiosResponse<FilmeModel> =
            await client.get('/', { params });

        // then
        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        // JSON-Array mit mind. 1 JSON-Objekt
        expect(data).toBeDefined();

        const { filme } = data._embedded;

        // Jeder Film hat im Array der Schlagwoerter z.B. "action"
        filme
            .map((film) => film.schlagwoerter)
            .forEach((schlagwoerter) =>
                expect(schlagwoerter).toEqual(
                    expect.arrayContaining([schlagwortVorhanden.toUpperCase()]),
                ),
            );
    });

    test('Mind. 1 Film mit mehreren Schlagwörtern', async () => {
        // given
        const params = {
            [schlagwortVorhanden]: 'true',
            drama: 'true',
        };

        // when
        const { status, headers, data }: AxiosResponse<FilmeModel> =
            await client.get('/', { params });

        // then
        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data).toBeDefined();

        const { filme } = data._embedded;

        // Jeder Film hat im Array der Schlagwoerter z.B. "drama, action"
        filme
            .map((film) => film.schlagwoerter)
            .forEach((schlagwoerter) =>
                expect(schlagwoerter).toEqual(
                    expect.arrayContaining([
                        schlagwortVorhanden.toUpperCase(),
                        'drama'.toUpperCase(),
                    ]),
                ),
            );
    });

    test('Alle Properties testen', async () => {
        for (const param of paramsMap.keys()) {
            // given
            const params = { [param]: paramsMap.get(param) };

            // when
            const { status, headers, data }: AxiosResponse<FilmeModel> =
                await client.get('/', { params });

            // then
            expect(status).toBe(HttpStatus.OK);
            expect(headers['content-type']).toMatch(/json/iu);
            expect(data).toBeDefined();

            const { filme } = data._embedded;

            expect(
                filme.map((film) => film[param as keyof FilmModel]?.toString()),
            ).toContain(paramsMap.get(param));
        }
    });

    test('Keine Filme zu einem nicht vorhandenen Schlagwort', async () => {
        // given
        const params = { [schlagwortNichtVorhanden]: 'true' };

        // when
        const { status, data }: AxiosResponse<ErrorResponse> = await client.get(
            '/',
            { params },
        );

        // then
        expect(status).toBe(HttpStatus.NOT_FOUND);

        const { error, statusCode } = data;

        expect(error).toBe('Not Found');
        expect(statusCode).toBe(HttpStatus.NOT_FOUND);
    });

    test('Keine Filme zu einer nicht-vorhandenen Property', async () => {
        // given
        const params = { foo: 'bar' };

        // when
        const { status, data }: AxiosResponse<ErrorResponse> = await client.get(
            '/',
            { params },
        );

        // then
        expect(status).toBe(HttpStatus.NOT_FOUND);

        const { error, statusCode } = data;

        expect(error).toBe('Not Found');
        expect(statusCode).toBe(HttpStatus.NOT_FOUND);
    });

    test('Kein Film zu falschem MIME-Typen', async () => {
        const { status }: AxiosResponse<ErrorResponse> = await client.get(
            '/',
            // eslint-disable-next-line @typescript-eslint/naming-convention
            { headers: { Accept: 'FEHLER' } },
        );

        expect(status).toBe(HttpStatus.NOT_ACCEPTABLE);
    });
});
/* eslint-enable no-underscore-dangle */
