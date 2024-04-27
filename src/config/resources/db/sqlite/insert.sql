-- Copyright (C) 2023 - present Juergen Zimmermann, Hochschule Karlsruhe
--
-- This program is free software: you can redistribute it and/or modify
-- it under the terms of the GNU General Public License as published by
-- the Free Software Foundation, either version 3 of the License, or
-- (at your option) any later version.
--
-- This program is distributed in the hope that it will be useful,
-- but WITHOUT ANY WARRANTY; without even the implied warranty of
-- MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
-- GNU General Public License for more details.
--
-- You should have received a copy of the GNU General Public License
-- along with this program.  If not, see <https://www.gnu.org/licenses/>.

-- "Konzeption und Realisierung eines aktiven Datenbanksystems"
-- "Verteilte Komponenten und Datenbankanbindung"
-- "Design Patterns"
-- "Freiburger Chorbuch"
-- "Maschinelle Lernverfahren zur Behandlung von Bonitätsrisiken im Mobilfunkgeschäft"
-- "Software Pioneers"

INSERT INTO film(id, version, titel, laenge, rating, filmart, preis, rabatt, streambar, erscheinungsdatum, schlagwoerter, erzeugt, aktualisiert) VALUES
    (1,0,'Star Trek Wars',120,4,'KINOFASSUNG',32.5,0.012,true,'1982-02-01','DRAMA','2022-02-01 00:00:00','2022-02-01 00:00:00');
INSERT INTO film(id, version, titel, laenge, rating, filmart, preis, rabatt, streambar, erscheinungsdatum, schlagwoerter, erzeugt, aktualisiert) VALUES
    (20,0,'Indiana Johnson',98,2,'ORIGINAL',26.2,0.032,true,'1997-10-02','ACTION','2022-02-02 00:00:00','2022-02-02 00:00:00');
INSERT INTO film(id, version, titel, laenge, rating, filmart, preis, rabatt, streambar, erscheinungsdatum, schlagwoerter, erzeugt, aktualisiert) VALUES
    (30,0,'Perry Otter',117,3,'KINOFASSUNG',73.3,0.033,true,'2002-12-03','DRAMA,ACTION','2022-02-03 00:00:00','2022-02-03 00:00:00');
INSERT INTO film(id, version, titel, laenge, rating, filmart, preis, rabatt, streambar, erscheinungsdatum, schlagwoerter, erzeugt, aktualisiert) VALUES
    (40,0,'Herr der Dinge',87,4,'KINOFASSUNG',46.4,0.064,true,'1999-02-04',null,'2022-02-04 00:00:00','2022-02-04 00:00:00');
INSERT INTO film(id, version, titel, laenge, rating, filmart, preis, rabatt, streambar, erscheinungsdatum, schlagwoerter, erzeugt, aktualisiert) VALUES
    (50,0,'Jon Wic',199,2,'ORIGINAL',12.5,0.029,true,'2016-08-05','ACTION','2022-02-05 00:00:00','2022-02-05 00:00:00');
INSERT INTO film(id, version, titel, laenge, rating, filmart, preis, rabatt, streambar, erscheinungsdatum, schlagwoerter, erzeugt, aktualisiert) VALUES
    (60,0,'Eisenmann',132,1,'ORIGINAL',45.6,0.017,true,'2008-02-06','ACTION','2022-02-06 00:00:00','2022-02-06 00:00:00');

INSERT INTO distributor(id, name, umsatz, homepage, film_id) VALUES
    (1,'Warner Bros',928375.34,'https://acme.it',1);
INSERT INTO distributor(id, name, umsatz, homepage, film_id) VALUES
    (20,'Universal',239875.3,'https://acme.it',20);
INSERT INTO distributor(id, name, umsatz, homepage, film_id) VALUES
    (30,'Pixar',204242.64,'https://acme.it',30);
INSERT INTO distributor(id, name, umsatz, homepage, film_id) VALUES
    (40,'Disney',239789.98,'https://acme.it',40);
INSERT INTO distributor(id, name, umsatz, homepage, film_id) VALUES
    (50,'Castle Rock',832957.23,'https://acme.it',50);
INSERT INTO distributor(id, name, umsatz, homepage, film_id) VALUES
    (60,'Trojan',154367.3,'https://acme.it',60);

INSERT INTO schauspieler(id, name, geburtsdatum, film_id) VALUES
    (1,'Johnson','2002-02-25',1);
INSERT INTO schauspieler(id, name, geburtsdatum, film_id) VALUES
    (20,'Smith','1990-04-17',20);
INSERT INTO schauspieler(id, name, geburtsdatum, film_id) VALUES
    (21,'Cruise','1987-07-10',20);
INSERT INTO schauspieler(id, name, geburtsdatum, film_id) VALUES
    (30,'Dicaprio','1065-10-05',30);
INSERT INTO schauspieler(id, name, geburtsdatum, film_id) VALUES
    (31,'Devito','2010-12-08',30);
INSERT INTO schauspieler(id, name, geburtsdatum, film_id) VALUES
    (40,'Albert','1976-05-09',40);
INSERT INTO schauspieler(id, name, geburtsdatum, film_id) VALUES
    (50,'Rodriguez','1955-03-02',50);
INSERT INTO schauspieler(id, name, geburtsdatum, film_id) VALUES
    (60,'Juan','2000-02-01',60);
