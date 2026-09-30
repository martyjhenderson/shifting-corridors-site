import { Input } from "@cloudflare/kumo";

interface FieldProps {
	value: unknown;
	onChange: (value: unknown) => void;
	label: string;
	id: string;
	required?: boolean;
}

/**
 * Native `<input type="date">` and `<input type="time">` read and write exactly
 * `YYYY-MM-DD` and 24-hour `HH:MM` — the formats the fields' validation
 * patterns expect — whatever the browser displays, so values pass through
 * unchanged. Clearing a picker stores null rather than an empty string, so an
 * optional field reads as unset.
 */
function pickerField(type: "date" | "time") {
	return function PickerField({ value, onChange, label, id, required }: FieldProps) {
		return (
			<Input
				label={label}
				id={id}
				type={type}
				value={typeof value === "string" ? value : ""}
				onChange={(e) => onChange(e.target.value || null)}
				required={required}
			/>
		);
	};
}

export const fields = {
	date: pickerField("date"),
	time: pickerField("time"),
};
