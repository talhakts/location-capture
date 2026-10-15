import { SourceAdapter, SourceCapabilities, ProviderSearchParams, SearchResultItem } from './types';

export class StockVideoAdapter implements SourceAdapter {
  public readonly id = 'stock_video';
  public readonly name = 'Licensed Stock Video Integration (Future Provider)';
  public readonly description =
    'Extensible adapter blueprint for commercial stock footage providers (e.g., Pond5, Shutterstock, Storyblocks) with API authorization.';

  public readonly capabilities: SourceCapabilities = {
    search: true,
    metadataRetrieval: true,
    previewDisplay: true,
    externalInspection: false,
    originalNavigation: true,
    directDownload: false,
    licenceMetadata: true,
    termsNotes:
      'Commercial stock footage providers require individual client licensing and API credentials.',
  };

  public async search(_params: ProviderSearchParams): Promise<SearchResultItem[]> {
    // Modular placeholder: returns clean explanation of provider status
    return [];
  }
}
