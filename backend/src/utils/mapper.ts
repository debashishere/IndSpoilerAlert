export function suggestMappings(headers: string[]): Record<string, string> {
  if (!headers || !Array.isArray(headers)) {
    return {};
  }

  // Guess if this is a Buyer sheet, Sales sheet, or Inventory sheet
  const cleanHeaders = headers.map(h => (h && typeof h === 'string' ? h.trim() : ''));

  const isBuyer = cleanHeaders.some(h =>
    /email|company|company.*name|buyer.*tier|short.*dated|min.*shelf/i.test(h)
  ) && !cleanHeaders.some(h =>
    /invoice|sku|quantity|expiration|lot|cases|sale/i.test(h)
  );

  const isSales = !isBuyer && cleanHeaders.some(h => 
    h && typeof h === 'string' && /invoice|brand|revenue|sold|buyer|customer|receipt|sale|order|per_case|unit_price/i.test(h)
  );

  const mapping: Record<string, string> = {};

  if (isBuyer) {
    mapping.companyName = '';
    mapping.email = '';
    mapping.tier = '';
    mapping.acceptsShortDated = '';
    mapping.minShelfLife = '';
    mapping.categories = '';
    mapping.transportRadius = '';
    mapping.excludedAllergens = '';

    const companyRegex = /^(company|company.*name|name|buyer.*name|buyer|retailer|business|store)$/i;
    const companyRegexFuzzy = /company|name|buyer|retailer|business|store/i;

    const emailRegex = /^(email|email.*address|buyer.*email|contact.*email|mail)$/i;
    const emailRegexFuzzy = /email|mail/i;

    const tierRegex = /^(tier|buyer.*tier|level|type)$/i;
    const tierRegexFuzzy = /tier|level/i;

    const shortDatedRegex = /^(short.*dated|accepts.*short.*dated)$/i;
    const shortDatedRegexFuzzy = /short.*dated/i;

    const shelfLifeRegex = /^(min.*shelf.*life|shelf.*life|min.*shelf)$/i;
    const shelfLifeRegexFuzzy = /shelf.*life/i;

    const categoriesRegex = /^(categories|category|preferred.*categories)$/i;
    const categoriesRegexFuzzy = /categor/i;

    const radiusRegex = /^(transport.*radius|radius|distance|max.*radius)$/i;
    const radiusRegexFuzzy = /radius/i;

    const allergensRegex = /^(excluded.*allergens|allergens|allergen.*filter)$/i;
    const allergensRegexFuzzy = /allergen/i;

    for (const header of cleanHeaders) {
      if (!header) continue;
      if (!mapping.companyName && companyRegex.test(header)) {
        mapping.companyName = header;
      } else if (!mapping.email && emailRegex.test(header)) {
        mapping.email = header;
      } else if (!mapping.tier && tierRegex.test(header)) {
        mapping.tier = header;
      } else if (!mapping.acceptsShortDated && shortDatedRegex.test(header)) {
        mapping.acceptsShortDated = header;
      } else if (!mapping.minShelfLife && shelfLifeRegex.test(header)) {
        mapping.minShelfLife = header;
      } else if (!mapping.categories && categoriesRegex.test(header)) {
        mapping.categories = header;
      } else if (!mapping.transportRadius && radiusRegex.test(header)) {
        mapping.transportRadius = header;
      } else if (!mapping.excludedAllergens && allergensRegex.test(header)) {
        mapping.excludedAllergens = header;
      }
    }

    for (const header of cleanHeaders) {
      if (!header) continue;
      if (Object.values(mapping).includes(header)) continue;

      if (!mapping.companyName && companyRegexFuzzy.test(header)) {
        mapping.companyName = header;
      } else if (!mapping.email && emailRegexFuzzy.test(header)) {
        mapping.email = header;
      } else if (!mapping.tier && tierRegexFuzzy.test(header)) {
        mapping.tier = header;
      } else if (!mapping.acceptsShortDated && shortDatedRegexFuzzy.test(header)) {
        mapping.acceptsShortDated = header;
      } else if (!mapping.minShelfLife && shelfLifeRegexFuzzy.test(header)) {
        mapping.minShelfLife = header;
      } else if (!mapping.categories && categoriesRegexFuzzy.test(header)) {
        mapping.categories = header;
      } else if (!mapping.transportRadius && radiusRegexFuzzy.test(header)) {
        mapping.transportRadius = header;
      } else if (!mapping.excludedAllergens && allergensRegexFuzzy.test(header)) {
        mapping.excludedAllergens = header;
      }
    }

    if (mapping.companyName) {
      mapping.name = mapping.companyName;
    }

    return mapping;
  }

  const skuRegex = /^(sku|stock.*keeping|prod.*id|product.*id|part.*num|item.*num|code|id)$/i;
  const skuRegexFuzzy = /sku|stock.*keeping|prod.*id|product.*id|part.*num|item.*num|code|id/i;
  
  const lotRegex = /^(lot|lot.*number|lot.*no|batch|batch.*no|batch.*number)$/i;
  const lotRegexFuzzy = /lot|batch/i;

  const qtyRegex = /^(qty|quantity|cases|volume|count|units|pack|quantity.*cases|qty.*cases|sold.*cases)$/i;
  const qtyRegexFuzzy = /qty|quantity|cases|volume|count|units|pack|sold/i;

  const warehouseRegex = /^(warehouse|dc|dist.*center|distribution.*center|location|facility|site)$/i;
  const warehouseRegexFuzzy = /warehouse|dc|dist.*center|distribution.*center|location|facility/i;

  if (isSales) {
    mapping.sku = '';
    mapping.lotNumber = '';
    mapping.buyerEmail = '';
    mapping.quantity = '';
    mapping.price = '';
    mapping.saleDate = '';
    mapping.invoiceNumber = '';
    mapping.brand = '';
    mapping.warehouse = '';
    mapping.revenue = '';

    const buyerEmailRegex = /^(buyer.*email|buyer|email|customer.*email)$/i;
    const buyerEmailRegexFuzzy = /buyer|email|customer/i;

    const priceRegex = /^(price|cost|original.*price|unit.*cost|rate|value|unit.*price|price.*case|sold.*price|unit.*price)$/i;
    const priceRegexFuzzy = /price|cost|rate|value/i;

    const saleDateRegex = /^(sale.*date|sold.*date|date|trans.*date|transaction.*date)$/i;
    const saleDateRegexFuzzy = /date|sold|trans/i;

    const invoiceRegex = /^(invoice|invoice.*number|invoice.*no|inv|inv.*no|inv.*number|receipt)$/i;
    const invoiceRegexFuzzy = /invoice|inv|receipt/i;

    const brandRegex = /^(brand|make|manufacturer|label|brand.*name)$/i;
    const brandRegexFuzzy = /brand|manufacturer|label/i;

    const revenueRegex = /^(revenue|total.*revenue|total.*value|total.*amount|amount|sales.*amount|turnover)$/i;
    const revenueRegexFuzzy = /revenue|amount|value|turnover/i;

    // First pass: Exact matches
    for (const header of headers) {
      if (!header || typeof header !== 'string') continue;
      const cleanHeader = header.trim();
      if (!mapping.sku && skuRegex.test(cleanHeader)) {
        mapping.sku = cleanHeader;
      } else if (!mapping.lotNumber && lotRegex.test(cleanHeader)) {
        mapping.lotNumber = cleanHeader;
      } else if (!mapping.buyerEmail && buyerEmailRegex.test(cleanHeader)) {
        mapping.buyerEmail = cleanHeader;
      } else if (!mapping.quantity && qtyRegex.test(cleanHeader)) {
        mapping.quantity = cleanHeader;
      } else if (!mapping.price && priceRegex.test(cleanHeader)) {
        mapping.price = cleanHeader;
      } else if (!mapping.saleDate && saleDateRegex.test(cleanHeader)) {
        mapping.saleDate = cleanHeader;
      } else if (!mapping.invoiceNumber && invoiceRegex.test(cleanHeader)) {
        mapping.invoiceNumber = cleanHeader;
      } else if (!mapping.brand && brandRegex.test(cleanHeader)) {
        mapping.brand = cleanHeader;
      } else if (!mapping.warehouse && warehouseRegex.test(cleanHeader)) {
        mapping.warehouse = cleanHeader;
      } else if (!mapping.revenue && revenueRegex.test(cleanHeader)) {
        mapping.revenue = cleanHeader;
      }
    }

    // Second pass: Fuzzy matches
    for (const header of headers) {
      if (!header || typeof header !== 'string') continue;
      const cleanHeader = header.trim();
      if (Object.values(mapping).includes(cleanHeader)) continue;

      if (!mapping.sku && skuRegexFuzzy.test(cleanHeader)) {
        mapping.sku = cleanHeader;
      } else if (!mapping.lotNumber && lotRegexFuzzy.test(cleanHeader)) {
        mapping.lotNumber = cleanHeader;
      } else if (!mapping.buyerEmail && buyerEmailRegexFuzzy.test(cleanHeader)) {
        mapping.buyerEmail = cleanHeader;
      } else if (!mapping.quantity && qtyRegexFuzzy.test(cleanHeader)) {
        mapping.quantity = cleanHeader;
      } else if (!mapping.price && priceRegexFuzzy.test(cleanHeader)) {
        mapping.price = cleanHeader;
      } else if (!mapping.saleDate && saleDateRegexFuzzy.test(cleanHeader)) {
        mapping.saleDate = cleanHeader;
      } else if (!mapping.invoiceNumber && invoiceRegexFuzzy.test(cleanHeader)) {
        mapping.invoiceNumber = cleanHeader;
      } else if (!mapping.brand && brandRegexFuzzy.test(cleanHeader)) {
        mapping.brand = cleanHeader;
      } else if (!mapping.warehouse && warehouseRegexFuzzy.test(cleanHeader)) {
        mapping.warehouse = cleanHeader;
      } else if (!mapping.revenue && revenueRegexFuzzy.test(cleanHeader)) {
        mapping.revenue = cleanHeader;
      }
    }
  } else {
    // Inventory mappings (original logic)
    mapping.sku = '';
    mapping.description = '';
    mapping.quantity = '';
    mapping.quantityCases = '';
    mapping.expirationDate = '';
    mapping.originalPrice = '';
    mapping.lotNumber = '';
    mapping.productionDate = '';
    mapping.category = '';
    mapping.standardSellPrice = '';
    mapping.warehouse = '';
    mapping.comment = '';

    const descRegex = /^(desc|description|item.*name|product.*name|name|details)$/i;
    const descRegexFuzzy = /desc|description|item.*name|product.*name|name|details/i;
    
    const expRegex = /^(exp|expiry|expiration|date|best.*before|exp.*date|expiration.*date)$/i;
    const expRegexFuzzy = /exp|expiry|expiration|date|best.*before/i;
    
    const priceRegex = /^(price|cost|original.*price|unit.*cost|rate|value|unit.*price)$/i;
    const priceRegexFuzzy = /price|cost|original.*price|unit.*cost|rate|value/i;

    const mfgRegex = /^(mfg.*date|production.*date|manufacture.*date|mfg|mfg.*dt)$/i;
    const mfgRegexFuzzy = /mfg|production.*date|manufactur/i;

    const categoryRegex = /^(category|cat|type|group|dept|department)$/i;
    const categoryRegexFuzzy = /category|cat|type|group|dept/i;

    const sellPriceRegex = /^(list.*price|sell.*price|standard.*price|standard.*sell.*price|retail.*price)$/i;
    const sellPriceRegexFuzzy = /list.*price|sell.*price|standard.*price|retail.*price/i;

    const commentRegex = /^(comment|comments|note|notes|remark|remarks)$/i;
    const commentRegexFuzzy = /comment|note|remark/i;

    // First pass: Exact matches
    for (const header of headers) {
      if (!header || typeof header !== 'string') continue;
      const cleanHeader = header.trim();
      if (!mapping.sku && skuRegex.test(cleanHeader)) {
        mapping.sku = cleanHeader;
      } else if (!mapping.description && descRegex.test(cleanHeader)) {
        mapping.description = cleanHeader;
      } else if (!mapping.quantity && qtyRegex.test(cleanHeader)) {
        mapping.quantity = cleanHeader;
        mapping.quantityCases = cleanHeader;
      } else if (!mapping.quantityCases && qtyRegex.test(cleanHeader)) {
        mapping.quantityCases = cleanHeader;
      } else if (!mapping.expirationDate && expRegex.test(cleanHeader)) {
        mapping.expirationDate = cleanHeader;
      } else if (!mapping.originalPrice && priceRegex.test(cleanHeader)) {
        mapping.originalPrice = cleanHeader;
      } else if (!mapping.lotNumber && lotRegex.test(cleanHeader)) {
        mapping.lotNumber = cleanHeader;
      } else if (!mapping.productionDate && mfgRegex.test(cleanHeader)) {
        mapping.productionDate = cleanHeader;
      } else if (!mapping.category && categoryRegex.test(cleanHeader)) {
        mapping.category = cleanHeader;
      } else if (!mapping.standardSellPrice && sellPriceRegex.test(cleanHeader)) {
        mapping.standardSellPrice = cleanHeader;
      } else if (!mapping.warehouse && warehouseRegex.test(cleanHeader)) {
        mapping.warehouse = cleanHeader;
      } else if (!mapping.comment && commentRegex.test(cleanHeader)) {
        mapping.comment = cleanHeader;
      }
    }

    // Second pass: Fuzzy matches
    for (const header of headers) {
      if (!header || typeof header !== 'string') continue;
      const cleanHeader = header.trim();
      const mappedValues = Object.values(mapping);
      if (mappedValues.includes(cleanHeader)) continue;

      if (!mapping.sku && skuRegexFuzzy.test(cleanHeader)) {
        mapping.sku = cleanHeader;
      } else if (!mapping.description && descRegexFuzzy.test(cleanHeader)) {
        mapping.description = cleanHeader;
      } else if (!mapping.quantity && qtyRegexFuzzy.test(cleanHeader)) {
        mapping.quantity = cleanHeader;
        mapping.quantityCases = cleanHeader;
      } else if (!mapping.quantityCases && qtyRegexFuzzy.test(cleanHeader)) {
        mapping.quantityCases = cleanHeader;
      } else if (!mapping.expirationDate && expRegexFuzzy.test(cleanHeader)) {
        mapping.expirationDate = cleanHeader;
      } else if (!mapping.originalPrice && priceRegexFuzzy.test(cleanHeader)) {
        mapping.originalPrice = cleanHeader;
      } else if (!mapping.lotNumber && lotRegexFuzzy.test(cleanHeader)) {
        mapping.lotNumber = cleanHeader;
      } else if (!mapping.productionDate && mfgRegexFuzzy.test(cleanHeader)) {
        mapping.productionDate = cleanHeader;
      } else if (!mapping.category && categoryRegexFuzzy.test(cleanHeader)) {
        mapping.category = cleanHeader;
      } else if (!mapping.standardSellPrice && sellPriceRegexFuzzy.test(cleanHeader)) {
        mapping.standardSellPrice = cleanHeader;
      } else if (!mapping.warehouse && warehouseRegexFuzzy.test(cleanHeader)) {
        mapping.warehouse = cleanHeader;
      } else if (!mapping.comment && commentRegexFuzzy.test(cleanHeader)) {
        mapping.comment = cleanHeader;
      }
    }
  }

  return mapping;
}
