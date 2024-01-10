
export const getIds = (value: any) => {
	if (Array.isArray(value)) {
		return value.map(({ sys }) => sys.id);
	}

	if (!Array.isArray(value) && typeof value === 'object' && value !== null) {
		return [value.sys.id];
	}

	return [];
};