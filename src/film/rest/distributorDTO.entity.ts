/* eslint-disable @typescript-eslint/no-magic-numbers */
import { IsOptional, IsUrl, Matches, MaxLength } from 'class-validator';
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
    @ApiProperty({ example: '1234.56', type: String })
    readonly umsatz: string | undefined;
}
/* eslint-enable @typescript-eslint/no-magic-numbers */
