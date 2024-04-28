// @eslint-community/eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/*
 * Copyright (C) 2021 - present Juergen Zimmermann, Hochschule Karlsruhe
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

import { type Film, type Filmart } from '../../src/film/entity/film.entity.js';
import { afterAll, beforeAll, describe, expect, test } from '@jest/globals';
import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import {
    host,
    httpsAgent,
    port,
    shutdownServer,
    startServer,
} from '../testserver.js';
import { type GraphQLFormattedError } from 'graphql';
import { type GraphQLRequest } from '@apollo/server';
import { HttpStatus } from '@nestjs/common';

// eslint-disable-next-line jest/no-export
export interface GraphQLResponseBody {
    data?: Record<string, any> | null;
    errors?: readonly [GraphQLFormattedError];
}

type FilmDTO = Omit<
    Film,
    'schauspielerListe' | 'aktualisiert' | 'erzeugt' | 'rabatt'
> & {
    rabatt: string;
};

// -----------------------------------------------------------------------------
// T e s t d a t e n
// -----------------------------------------------------------------------------
const idVorhanden = '1';

const distributorNameVorhanden = 'Universal';
const teilDistributorNameVorhanden = 'a';
const teilDistributornameNichtVorhanden = 'abc';

const titelVorhanden = 'Star Trek Wars';

const ratingVorhanden = 2;
const ratingNichtVorhanden = 99;

// -----------------------------------------------------------------------------
// T e s t s
// -----------------------------------------------------------------------------
// Test-Suite
// eslint-disable-next-line max-lines-per-function
describe('GraphQL Queries', () => {
    let client: AxiosInstance;
    const graphqlPath = 'graphql';

    // Testserver starten und dabei mit der DB verbinden
    beforeAll(async () => {
        await startServer();
        const baseURL = `https://${host}:${port}/`;
        client = axios.create({
            baseURL,
            httpsAgent,
            // auch Statuscode 400 als gueltigen Request akzeptieren, wenn z.B.
            // ein Enum mit einem falschen String getestest wird
            validateStatus: () => true,
        });
    });

    afterAll(async () => {
        await shutdownServer();
    });

    test('Film zu vorhandener ID', async () => {
        // given
        const body: GraphQLRequest = {
            query: `
                {
                    film(id: "${idVorhanden}") {
                        version
                        titel
                        laenge
                        rating
                        filmart
                        preis
                        streambar
                        erscheinungsdatum
                        schlagwoerter
                        distributor {
                            name
                        }
                        rabatt(short: true)
                    }
                }
            `,
        };

        // when
        const { status, headers, data }: AxiosResponse<GraphQLResponseBody> =
            await client.post(graphqlPath, body);

        // then
        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu); // eslint-disable-line sonarjs/no-duplicate-string
        expect(data.errors).toBeUndefined();
        expect(data.data).toBeDefined();

        const { film } = data.data!;
        const result: FilmDTO = film;

        expect(result.distributor?.name).toMatch(/^\w/u);
        expect(result.version).toBeGreaterThan(-1);
        expect(result.id).toBeUndefined();
    });

    test('Film zu nicht-vorhandener ID', async () => {
        // given
        const id = '999999';
        const body: GraphQLRequest = {
            query: `
                {
                    film(id: "${id}") {
                        distributor {
                            name
                        }
                    }
                }
            `,
        };

        // when
        const { status, headers, data }: AxiosResponse<GraphQLResponseBody> =
            await client.post(graphqlPath, body);

        // then
        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.data!.film).toBeNull();

        const { errors } = data;

        expect(errors).toHaveLength(1);

        const [error] = errors!;
        const { message, path, extensions } = error;

        expect(message).toBe(`Es gibt keinen Film mit der ID ${id}.`);
        expect(path).toBeDefined();
        expect(path![0]).toBe('film');
        expect(extensions).toBeDefined();
        expect(extensions!.code).toBe('BAD_USER_INPUT');
    });

    test('Film zu vorhandenem Distributor', async () => {
        // given
        const body: GraphQLRequest = {
            query: `
                {
                    filme(suchkriterien: {
                        distributor: "${distributorNameVorhanden}"
                    }) {
                        filmart
                        distributor {
                            name
                        }
                    }
                }
            `,
        };

        // when
        const { status, headers, data }: AxiosResponse<GraphQLResponseBody> =
            await client.post(graphqlPath, body);

        // then
        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.errors).toBeUndefined();

        expect(data.data).toBeDefined();

        const { filme } = data.data!;

        expect(filme).not.toHaveLength(0);

        const filmeArray: FilmDTO[] = filme;

        expect(filmeArray).toHaveLength(1);

        const [film] = filmeArray;

        expect(film!.distributor?.name).toBe(distributorNameVorhanden);
    });

    test('Film zu vorhandenem Teil-DistributorName', async () => {
        // given
        const body: GraphQLRequest = {
            query: `
                {
                    filme(suchkriterien: {
                        distributor: "${teilDistributorNameVorhanden}"
                    }) {
                        distributor {
                            name
                        }
                    }
                }
            `,
        };

        // when
        const { status, headers, data }: AxiosResponse<GraphQLResponseBody> =
            await client.post(graphqlPath, body);

        // then
        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.errors).toBeUndefined();
        expect(data.data).toBeDefined();

        const { filme } = data.data!;

        expect(filme).not.toHaveLength(0);

        const filmeArray: FilmDTO[] = filme;
        filmeArray
            .map((film) => film.distributor)
            .forEach((distributor) =>
                expect(distributor?.name.toLowerCase()).toEqual(
                    expect.stringContaining(teilDistributorNameVorhanden),
                ),
            );
    });

    test('Film zu nicht vorhandenem Distributor', async () => {
        // given
        const body: GraphQLRequest = {
            query: `
                {
                    filme(suchkriterien: {
                        distributor: "${teilDistributornameNichtVorhanden}"
                    }) {
                        filmart
                        distributor {
                            name
                        }
                    }
                }
            `,
        };

        // when
        const { status, headers, data }: AxiosResponse<GraphQLResponseBody> =
            await client.post(graphqlPath, body);

        // then
        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.data!.filme).toBeNull();

        const { errors } = data;

        expect(errors).toHaveLength(1);

        const [error] = errors!;
        const { message, path, extensions } = error;

        expect(message).toMatch(/^Keine Filme gefunden:/u);
        expect(path).toBeDefined();
        expect(path![0]).toBe('filme');
        expect(extensions).toBeDefined();
        expect(extensions!.code).toBe('BAD_USER_INPUT');
    });

    // Erscheinungsdatum + Titel müssen eindeutig sein
    test('Film zu vorhandener Titel', async () => {
        // given
        const body: GraphQLRequest = {
            query: `
                {
                    filme(suchkriterien: {
                        titel: "${titelVorhanden}"
                    }) {
                        titel
                        distributor {
                            name
                        }
                    }
                }
            `,
        };

        // when
        const { status, headers, data }: AxiosResponse<GraphQLResponseBody> =
            await client.post(graphqlPath, body);

        // then
        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.errors).toBeUndefined();

        expect(data.data).toBeDefined();

        const { filme } = data.data!;

        expect(filme).not.toHaveLength(0);

        const filmeArray: FilmDTO[] = filme;

        expect(filmeArray).toHaveLength(1);

        const [film] = filmeArray;
        const { titel, distributor } = film!;

        expect(titel).toBe(titelVorhanden);
        expect(distributor?.name).toBeDefined();
    });

    test('Filme zu vorhandenem "rating"', async () => {
        // given
        const body: GraphQLRequest = {
            query: `
                {
                    filme(suchkriterien: {
                        rating: ${ratingVorhanden},
                        distributor: "${teilDistributorNameVorhanden}"
                    }) {
                        rating
                        distributor {
                            name
                        }
                    }
                }
            `,
        };

        // when
        const { status, headers, data }: AxiosResponse<GraphQLResponseBody> =
            await client.post(graphqlPath, body);

        // then
        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.errors).toBeUndefined();

        expect(data.data).toBeDefined();

        const { filme } = data.data!;

        expect(filme).not.toHaveLength(0);

        const filmeArray: FilmDTO[] = filme;

        filmeArray.forEach((film) => {
            const { rating, distributor } = film;

            expect(rating).toBe(ratingVorhanden);
            expect(distributor?.name.toLowerCase()).toEqual(
                expect.stringContaining(teilDistributorNameVorhanden),
            );
        });
    });

    test('Kein Film zu nicht-vorhandenem "rating"', async () => {
        // given
        const body: GraphQLRequest = {
            query: `
                {
                    filme(suchkriterien: {
                        rating: ${ratingNichtVorhanden}
                    }) {
                        distributor {
                            name
                        }
                    }
                }
            `,
        };

        // when
        const { status, headers, data }: AxiosResponse<GraphQLResponseBody> =
            await client.post(graphqlPath, body);

        // then
        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.data!.filme).toBeNull();

        const { errors } = data;

        expect(errors).toHaveLength(1);

        const [error] = errors!;
        const { message, path, extensions } = error;

        expect(message).toMatch(/^Keine Filme gefunden:/u);
        expect(path).toBeDefined();
        expect(path![0]).toBe('filme');
        expect(extensions).toBeDefined();
        expect(extensions!.code).toBe('BAD_USER_INPUT');
    });

    test('Filme zur Art "KINOFASSUNG"', async () => {
        // given
        const filmArt: Filmart = 'KINOFASSUNG';
        const body: GraphQLRequest = {
            query: `
                {
                    filme(suchkriterien: {
                        filmart: ${filmArt}
                    }) {
                        filmart
                        distributor {
                            name
                        }
                    }
                }
            `,
        };

        // when
        const { status, headers, data }: AxiosResponse<GraphQLResponseBody> =
            await client.post(graphqlPath, body);

        // then
        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.errors).toBeUndefined();

        expect(data.data).toBeDefined();

        const { filme } = data.data!;

        expect(filme).not.toHaveLength(0);

        const filmeArray: FilmDTO[] = filme;

        filmeArray.forEach((film) => {
            const { filmart, distributor } = film;

            expect(filmart).toBe(filmArt);
            expect(distributor?.name).toBeDefined();
        });
    });

    test('Filme zur einer ungueltigen Art', async () => {
        // given
        const filmArt = 'UNGUELTIG';
        const body: GraphQLRequest = {
            query: `
                {
                    filme(suchkriterien: {
                        filmart: ${filmArt}
                    }) {
                        distributor {
                            name
                        }
                    }
                }
            `,
        };

        // when
        const { status, headers, data }: AxiosResponse<GraphQLResponseBody> =
            await client.post(graphqlPath, body);

        // then
        expect(status).toBe(HttpStatus.BAD_REQUEST);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.data).toBeUndefined();

        const { errors } = data;

        expect(errors).toHaveLength(1);

        const [error] = errors!;
        const { extensions } = error;

        expect(extensions).toBeDefined();
        expect(extensions!.code).toBe('GRAPHQL_VALIDATION_FAILED');
    });

    test('Filme mit streambar=true', async () => {
        // given
        const body: GraphQLRequest = {
            query: `
                {
                    filme(suchkriterien: {
                        streambar: true
                    }) {
                        streambar
                        distributor {
                            name
                        }
                    }
                }
            `,
        };

        // when
        const { status, headers, data }: AxiosResponse<GraphQLResponseBody> =
            await client.post(graphqlPath, body);

        // then
        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.errors).toBeUndefined();

        expect(data.data).toBeDefined();

        const { filme } = data.data!;

        expect(filme).not.toHaveLength(0);

        const filmeArray: FilmDTO[] = filme;

        filmeArray.forEach((film) => {
            const { streambar, distributor } = film;

            expect(streambar).toBe(true);
            expect(distributor?.name).toBeDefined();
        });
    });
});

/* eslint-enable @typescript-eslint/no-unsafe-assignment */
/* eslint-enable max-lines */
