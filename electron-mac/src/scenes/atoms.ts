import { atom } from 'jotai';
import { FormInstructionItem, formInstructionItemsQWS } from '../coaching/formInstructionItems';
import { resetSet, Set } from '../training/set';

export const phaseAtom = atom<number>(0);

export const repVideoUrlsAtom = atom<string[]>([]);

export const formInstructionItemsAtom = atom<FormInstructionItem[]>(formInstructionItemsQWS);

export const setRecordAtom = atom<Set>(resetSet());
