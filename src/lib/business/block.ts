import type { Token } from "./token";

export type Block =
{
    type : 'question' | 'answer',
    tokens : Token[],
    busy : boolean,
    comment : string,
}