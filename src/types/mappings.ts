export type CitySpecificDeviationTypeMapping = Record<
    number,
    { type: string; notes: string }
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