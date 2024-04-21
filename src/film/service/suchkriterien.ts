/**
 * Das Modul besteht aus der Klasse {@linkcode FilmReadService}.
 * @packageDocumentation
 */

import { type FilmArt } from '../entity/film.entity';

/**
 * Typdefinition für FilmReadService().find und QueryBuilder.build().
 */
export interface Suchkriterien {
    readonly titel?: string;
    readonly rating?: number;
    readonly art?: FilmArt;
    readonly laenge?: number;
    readonly preis?: number;
    readonly rabatt?: number;
    readonly streambar?: boolean;
    readonly erscheinungsdatum?: Date;
    readonly schlagwoerter?: string[];
}
