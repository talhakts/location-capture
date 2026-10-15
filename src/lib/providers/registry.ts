import { SourceAdapter } from './types';
import { GeographAdapter } from './geograph-adapter';
import { GoogleMapsAdapter } from './google-maps-adapter';
import { GoogleEarthStudioAdapter } from './google-earth-adapter';
import { StockVideoAdapter } from './stock-video-adapter';

class SourceRegistry {
  private adapters: Map<string, SourceAdapter> = new Map();

  constructor() {
    this.register(new GeographAdapter());
    this.register(new GoogleMapsAdapter());
    this.register(new GoogleEarthStudioAdapter());
    this.register(new StockVideoAdapter());
  }

  public register(adapter: SourceAdapter): void {
    this.adapters.set(adapter.id, adapter);
  }

  public get(id: string): SourceAdapter | undefined {
    return this.adapters.get(id);
  }

  public getAll(): SourceAdapter[] {
    return Array.from(this.adapters.values());
  }

  public getGeographAdapter(): GeographAdapter {
    return this.adapters.get('geograph') as GeographAdapter;
  }
}

export const sourceRegistry = new SourceRegistry();
