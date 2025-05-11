type User = {
    id?: number,
    name: string,
    age: number,
    hobbies: Array<string>
}

export const crudDB: Array<User> = [
    {
        id: 1,
        name: "Ivan",
        age: 43,
        hobbies: ["football", "horseriding"]
    }
];