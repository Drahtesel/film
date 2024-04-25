/**
 * Das Modul besteht aus der Klasse {@linkcode FilmReadService}.
 * @packageDocumentation
 */

import { type Art } from '../entity/film.entity';

/**
 * Typdefinition für FilmReadService().find und QueryBuilder.build().
 */
export interface Suchkriterien {
    readonly titel?: string;
    readonly rating?: number;
    readonly art?: Art;
    readonly laenge?: number;
    readonly preis?: number;
    readonly rabatt?: number;
    readonly streambar?: boolean;
    readonly erscheinungsdatum?: Date;
    readonly drama?: string;
    readonly action?: string;
    readonly distributor?: string;
}
