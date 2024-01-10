export type EntrySaved = {
	sys: {
		type: 'Link';
		linkType: string;
		id: string;
	};
}

export type SortBy = 'title' | 'date';

export type EntryWithError = {
    sys: {
        id: string;
    }
}
  