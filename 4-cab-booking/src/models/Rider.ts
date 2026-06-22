import { Coordinates } from "./Location";

/** Pasajero de la plataforma. */
export class Rider {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public location: Coordinates,
  ) {}
}
