export type FeeAlterationType = "DISCOUNT" | "INCREASE" | "RELIEF";
export type CitySpecificDeviationTypeMapping = Record<
    number,
    { type: FeeAlterationType; notes: string }
>;
export type CitySpecificDeviationTypeMappings = Record<
    string,
    CitySpecificDeviationTypeMapping
>;

export type EfficaIncomeCodeMapping = {
    codes: number[],
    evakaType: string,
    sign?: string
}

export type CitySpecificIncomeMapping = {
    coefficientMap: Record<string, string>
    incomeTypeMap: EfficaIncomeCodeMapping[]
    incomePeriodMap: EfficaIncomeCodeMapping[]
}

export type CitySpecificIncomeMappings = Record<string, CitySpecificIncomeMapping>