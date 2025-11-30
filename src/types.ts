export type PartialWithKeys<Type> = {
    [Key in keyof Type]: Type[Key] | undefined;
};
