/* eslint-disable @typescript-eslint/no-magic-numbers */

/**
 * Das Modul besteht aus der Entity-Klasse.
 * @packageDocumentation
 */

import { IsISO8601, IsOptional, Matches, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Entity-Klasse für Schauspieler ohne TypeORM.
 */
export class SchauspielerDTO {
    @Matches('^\\w.*')
    @MaxLength(40)
    @ApiProperty({ example: 'Der Name', type: String })
    readonly name!: string;

    @IsOptional()
    @IsISO8601({ strict: true })
    @ApiProperty({ example: '2023-12-31', type: Date })
    readonly geburtsdatum: Date | undefined;
}
/* eslint-enable @typescript-eslint/no-magic-numbers */
