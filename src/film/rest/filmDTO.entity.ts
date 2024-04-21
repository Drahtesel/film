/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable max-classes-per-file */
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
import { DistributorDTO } from './distributorDTO.entity';
import { SchauspielerDTO } from './schauspielerDTO.entity';
import { Type } from 'class-transformer';

export const MAX_RATING = 5;

/**
 * Entity-Klasse für Filme ohne TypeORM.
 */
export class FilmDTOOhneRef {
    @IsInt()
    @Min(0)
    @Max(MAX_RATING)
    @ApiProperty({ example: 5, type: Number })
    readonly rating: number | undefined;

    @Matches('^\\w.*')
    @MaxLength(40)
    @ApiProperty({ example: 'Der Film', type: String })
    readonly titel!: string;

    @IsOptional()
    @Matches(/^KINOFASSUNG$|^ORIGINAL$/u)
    @ApiProperty({ example: 'ORIGINAL', type: String })
    readonly art: string | undefined;

    @IsPositive()
    @ApiProperty({ example: '123', type: Number })
    readonly laenge!: number;

    @IsPositive()
    @ApiProperty({ example: 19.99, type: Number })
    readonly preis!: number;

    @IsOptional()
    @Min(0)
    @Max(1)
    @IsPositive()
    @ApiProperty({ example: 0.1, type: Number })
    readonly rabatt: number | undefined;

    @IsBoolean()
    @ApiProperty({ example: true, type: Boolean })
    readonly streambar: boolean | undefined;

    @IsISO8601({ strict: true })
    @IsOptional()
    @ApiProperty({ example: '2021-01-31' })
    readonly erscheinungsdatum: Date | string | undefined;

    @ArrayUnique()
    @IsOptional()
    @ApiProperty({ example: ['ACTION', 'DRAMA'], type: [String] })
    readonly schlagwoerter: string[] | undefined;
}

export class FilmDTO extends FilmDTOOhneRef {
    @ValidateNested()
    @Type(() => DistributorDTO)
    @ApiProperty({ type: DistributorDTO })
    readonly distributor!: DistributorDTO;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => SchauspielerDTO)
    @ApiProperty({ type: [SchauspielerDTO] })
    readonly schauspieler: SchauspielerDTO[] | undefined;
}
/* eslint-enable @typescript-eslint/no-magic-numbers */
/* eslint-enable max-classes-per-file */
