/*
 * Copyright (C) 2016 - present Juergen Zimmermann, Florian Goebel, Hochschule Karlsruhe
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

// Nest unterstützt verschiedene Werkzeuge fuer OR-Mapping
// https://docs.nestjs.com/techniques/database
//  * TypeORM     https://typeorm.io
//  * Sequelize   https://sequelize.org
//  * Knex        https://knexjs.org

// TypeORM unterstützt die Patterns
//  * "Data Mapper" und orientiert sich an Hibernate (Java), Doctrine (PHP) und Entity Framework (C#)
//  * "Active Record" und orientiert sich an Mongoose (JavaScript)

// TypeORM unterstützt u.a. die DB-Systeme
//  * Postgres
//  * MySQL
//  * SQLite durch sqlite3 und better-sqlite3
//  * Oracle
//  * Microsoft SQL Server
//  * SAP Hana
//  * Cloud Spanner von Google

/**
 * Das Modul besteht aus der Entity-Klasse.
 * @packageDocumentation
 */

import {
    Column,
    CreateDateColumn,
    Entity,
    OneToMany,
    OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { DecimalTransformer } from './decimal-transformer.js';
import { Distributor } from './distributor.entity.js';
import { Schauspieler } from './schauspieler.entity.js';
import { dbType } from '../../config/db.js';

/**
 * Alias-Typ für gültige Strings bei der Art eines Films.
 */
export type FilmArt = 'KINOFASSUNG' | 'ORIGINAL';

/**
 * Entity-Klasse zu einer relationalen Tabelle
 */
// https://typeorm.io/entities
@Entity()
export class Film {
    // https://typeorm.io/entities#primary-columns
    // default: strategy = 'increment' (SEQUENCE, GENERATED ALWAYS AS IDENTITY, AUTO_INCREMENT)
    @PrimaryGeneratedColumn()
    id: number | undefined;

    @Column('int')
    @ApiProperty({ example: 5, type: Number })
    readonly rating: number | undefined;

    @Column('varchar')
    @ApiProperty({ example: 'KINOFASSUNG', type: String })
    readonly art: FilmArt | undefined;

    @Column('int')
    @ApiProperty({ example: 300, type: Number })
    readonly laenge: number | undefined;

    @Column('decimal', {
        precision: 8,
        scale: 2,
        transformer: new DecimalTransformer(),
    })
    @ApiProperty({ example: 1, type: Number })
    readonly preis!: number;

    @Column('decimal', {
        precision: 4,
        scale: 3,
        transformer: new DecimalTransformer(),
    })
    @ApiProperty({ example: 0.1, type: Number })
    readonly rabatt: number | undefined;

    @Column('boolean')
    @ApiProperty({ example: true, type: Boolean })
    readonly streambar: boolean | undefined;

    @Column('date')
    @ApiProperty({ example: '2021-01-31' })
    readonly erscheinungsdatum: Date | string | undefined;

    @Column('simple-array')
    schlagwoerter: string[] | null | undefined;

    @OneToOne(() => Distributor, (distributor) => distributor.film, {
        cascade: ['insert', 'remove'],
    })
    readonly distributor: Distributor | undefined;

    // undefined wegen Updates
    @OneToMany(() => Schauspieler, (schauspieler) => schauspieler.film, {
        cascade: ['insert', 'remove'],
    })
    readonly schauspieler: Schauspieler[] | undefined;

    @CreateDateColumn({
        type: dbType === 'sqlite' ? 'datetime' : 'timestamp',
    })
    readonly erzeugt: Date | undefined;

    @UpdateDateColumn({
        type: dbType === 'sqlite' ? 'datetime' : 'timestamp',
    })
    readonly aktualisiert: Date | undefined;

    public toString = (): string =>
        JSON.stringify({
            id: this.id,
            laenge: this.laenge,
            rating: this.rating,
            art: this.art,
            preis: this.preis,
            rabatt: this.rabatt,
            lieferbar: this.streambar,
            datum: this.erscheinungsdatum,
            schlagwoerter: this.schlagwoerter,
            erzeugt: this.erzeugt,
            aktualisiert: this.aktualisiert,
        });
}
