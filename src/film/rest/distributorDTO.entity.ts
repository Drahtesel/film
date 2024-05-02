/* eslint-disable @typescript-eslint/no-magic-numbers */

/**
 * Das Modul besteht aus der Entity-Klasse.
 * @packageDocumentation
 */

import { IsOptional, IsUrl, Matches, MaxLength, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Entity-Klasse für Distributor ohne TypeORM.
 */
export class DistributorDTO {
    @Matches('^\\w.*')
    @MaxLength(40)
    @ApiProperty({ example: 'Der Name', type: String })
    readonly name!: string;

    @IsUrl()
    @IsOptional()
    @ApiProperty({ example: 'https://www.example.com', type: String })
    readonly homepage: string | undefined;

    @IsOptional()
    @Min(0)
    @ApiProperty({ example: '1234.56', type: String })
    readonly umsatz: number | undefined;
}
/* eslint-enable @typescript-eslint/no-magic-numbers */
