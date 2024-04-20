/*
 * Copyright (C) 2023 - present Juergen Zimmermann, Florian Goebel, Hochschule Karlsruhe
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
    Column,
    Entity,
    JoinColumn,
    OneToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { DecimalTransformer } from './decimal-transformer.js';
import { Film } from './film.entity.js';

@Entity()
export class Distributor {
    @PrimaryGeneratedColumn()
    id: number | undefined;

    @Column()
    readonly name!: string;

    @Column('decimal', {
        precision: 8,
        scale: 2,
        transformer: new DecimalTransformer(),
    })
    @ApiProperty({ example: 1234.56, type: Number })
    readonly umsatz: number | undefined;

    @Column('varchar')
    @ApiProperty({ example: 'https://test.de/', type: String })
    readonly homepage: string | undefined;

    @OneToOne(() => Film, (film) => film.distributor)
    @JoinColumn({ name: 'film_id' })
    film: Film | undefined;

    public toString = (): string =>
        JSON.stringify({
            id: this.id,
            name: this.name,
            umsatz: this.umsatz,
            homepage: this.homepage,
        });
}
