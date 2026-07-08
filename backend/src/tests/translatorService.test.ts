import { translateAttributes, SemanticRule } from '../services/translatorService';

describe('translatorService - Dynamic Data Translator Engine', () => {
  it('should translate unmapped CPG supplier attributes into normalized semantic attributes and preserve rawAttributes', () => {
    const rawInput = {
      'StorageTemp_C': '-18',
      'Kosher Status': 'YES',
      'Pallet TI/HI': '10x5',
      'Custom QA Note': 'Passed sensory check'
    };

    const result = translateAttributes(rawInput);

    expect(result.attributes).toBeDefined();
    expect(result.rawAttributes).toEqual(rawInput);
    expect(result.attributes.tempMinF).toBeCloseTo(-0.4, 1);
    expect(result.attributes.certifications).toEqual(expect.arrayContaining(['kosher']));
    expect(result.attributes.palletTiHi).toBe('10x5');
    expect(result.attributes['Custom QA Note']).toBe('Passed sensory check');
  });

  it('should apply explicit declarative SemanticRule transformations without any many-to-many connections', () => {
    const rawInput = {
      'Storage_Temperature': '-10',
      'Is_FDA_Compliant': 'true',
      'Case_Pack_Weight': '25.50 lbs',
      'Allergen_List': 'dairy, soy, wheat'
    };

    const rules: SemanticRule[] = [
      { sourceKey: 'Storage_Temperature', targetKey: 'minStorageTempF', transform: 'celsiusToFahrenheit' },
      { sourceKey: 'Is_FDA_Compliant', targetKey: 'fdaCompliant', transform: 'toBoolean' },
      { sourceKey: 'Case_Pack_Weight', targetKey: 'packWeightLbs', transform: 'toNumber' },
      { sourceKey: 'Allergen_List', targetKey: 'allergens', transform: 'toStringList' }
    ];

    const result = translateAttributes(rawInput, rules);

    expect(result.attributes.minStorageTempF).toBe(14);
    expect(result.attributes.fdaCompliant).toBe(true);
    expect(result.attributes.packWeightLbs).toBe(25.5);
    expect(result.attributes.allergens).toEqual(['dairy', 'soy', 'wheat']);
    expect(result.rawAttributes).toEqual(rawInput);
  });
});

