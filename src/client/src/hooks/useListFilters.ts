import {
	compareAsc,
	compareDesc,
	endOfDay,
	isWithinInterval,
	parseISO,
	startOfDay,
} from "date-fns";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

export type SortOrder = "newest" | "oldest";

interface UseListFiltersOptions<T> {
	items: T[];
	searchFields: (keyof T)[];
	dateField: keyof T;
	defaultSort?: SortOrder;
}

export function useListFilters<T>({
	items,
	searchFields,
	dateField,
	defaultSort = "newest",
}: UseListFiltersOptions<T>) {
	const [searchParams, setSearchParams] = useSearchParams();

	// URL state
	const searchParam = searchParams.get("q") || "";
	const sort = (searchParams.get("sort") as SortOrder) || defaultSort;
	const from = searchParams.get("from") || "";
	const to = searchParams.get("to") || "";

	// Local state for search input (to allow immediate typing)
	const [searchInput, setSearchInput] = useState(searchParam);

	// Sync local search input with URL param when URL changes (e.g. back button or clear filters)
	useEffect(() => {
		setSearchInput(searchParam);
	}, [searchParam]);

	const setFilter = useCallback(
		(params: Record<string, string | null>) => {
			const newParams = new URLSearchParams(searchParams);
			Object.entries(params).forEach(([key, value]) => {
				if (value === null || value === "") {
					newParams.delete(key);
				} else {
					newParams.set(key, value);
				}
			});
			setSearchParams(newParams, { replace: true });
		},
		[searchParams, setSearchParams],
	);

	// Debounced search update
	useEffect(() => {
		const timer = setTimeout(() => {
			if (searchInput !== searchParam) {
				setFilter({ q: searchInput });
			}
		}, 300);
		return () => clearTimeout(timer);
	}, [searchInput, searchParam, setFilter]);

	const filteredItems = useMemo(() => {
		let result = [...items];

		// Search
		if (searchParam) {
			const query = searchParam.toLowerCase();
			result = result.filter((item) =>
				searchFields.some((field) => {
					const value = item[field];
					if (value === null || value === undefined) return false;
					return String(value).toLowerCase().includes(query);
				}),
			);
		}

		// Date Range
		if (from || to) {
			result = result.filter((item) => {
				const itemDateValue = item[dateField];
				if (!itemDateValue) return false;

				const itemDate = new Date(itemDateValue as string);
				try {
					const start = from ? startOfDay(parseISO(from)) : null;
					const end = to ? endOfDay(parseISO(to)) : null;

					if (start && end) {
						if (start > end) return false; // Invalid range
						return isWithinInterval(itemDate, { start, end });
					}
					if (start) {
						return itemDate >= start;
					}
					if (end) {
						return itemDate <= end;
					}
				} catch {
					return true; // Ignore invalid dates
				}
				return true;
			});
		}

		// Sort
		result.sort((a, b) => {
			const dateA = new Date(a[dateField] as string);
			const dateB = new Date(b[dateField] as string);
			return sort === "newest"
				? compareDesc(dateA, dateB)
				: compareAsc(dateA, dateB);
		});

		return result;
	}, [items, searchParam, sort, from, to, searchFields, dateField]);

	return {
		filteredItems,
		search: searchInput,
		setSearch: setSearchInput,
		sort,
		setSort: (s: SortOrder) => setFilter({ sort: s }),
		from,
		setFrom: (f: string) => setFilter({ from: f }),
		to,
		setTo: (t: string) => setFilter({ to: t }),
		clearFilters: () => {
			setSearchParams({});
			setSearchInput("");
		},
		isActive: Boolean(searchParam || from || to || sort !== defaultSort),
	};
}
