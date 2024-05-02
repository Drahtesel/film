/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable max-classes-per-file */

/**
 * Das Modul besteht aus der Entity-Klasse.
 * @packageDocumentation
 */

import {
    ArrayUnique,
    IsArray,
    IsBoolean,
    IsISO8601,
    IsInt,
    IsOptional,
    IsPositive,
    Matches,
    Max,
    MaxLength,
    Min,
    ValidateNested,
} from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';
import { DistributorDTO } from './distributorDTO.entity.js';
import { type Filmart } from '../entity/film.entity.js';
import { SchauspielerDTO } from './schauspielerDTO.entity.js';
import { Type } from 'class-transformer';

export const MAX_RATING = 5;

/**
 * Entity-Klasse für Filme ohne TypeORM.
 */
export class FilmDtoOhneRef {
    @Matches('^\\w.*')
    @MaxLength(40)
    @ApiProperty({ example: 'Der Film', type: String })
    readonly titel!: string;

    @IsInt()
    @Min(0)
    @Max(MAX_RATING)
    @ApiProperty({ example: 5, type: Number })
    readonly rating: number | undefined;

    @IsOptional()
    @Matches(/^KINOFASSUNG$|^ORIGINAL$/u)
    @ApiProperty({ example: 'ORIGINAL', type: String })
    readonly filmart: Filmart | undefined;

    @IsPositive()
    @ApiProperty({ example: '123', type: Number })
    readonly laenge!: number;

    @IsPositive()
    @ApiProperty({ example: 19.99, type: Number })
    readonly preis!: number;

    @IsOptional()
    @Min(0)
    @Max(1)
    @ApiProperty({ example: 0.1, type: Number })
    readonly rabatt: number | undefined;

    @IsBoolean()
    @ApiProperty({ example: true, type: Boolean })
    readonly streambar: boolean | undefined;

    @IsISO8601({ strict: true })
    @IsOptional()
    @ApiProperty({ example: '2021-01-31' })
    readonly erscheinungsdatum!: Date | string;

    @ArrayUnique()
    @IsOptional()
    @ApiProperty({ example: ['ACTION', 'DRAMA'], type: [String] })
    readonly schlagwoerter: string[] | undefined;
}

/**
 * Entity-Klasse für Filme ohne TypeORM.
 */
export class FilmDTO extends FilmDtoOhneRef {
    @ValidateNested()
    @Type(() => DistributorDTO)
    @ApiProperty({ type: DistributorDTO })
    readonly distributor!: DistributorDTO;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => SchauspielerDTO)
    @ApiProperty({ type: [SchauspielerDTO] })
    readonly schauspielerListe: SchauspielerDTO[] | undefined;
}
/* eslint-enable @typescript-eslint/no-magic-numbers */
/* eslint-enable max-classes-per-file */
