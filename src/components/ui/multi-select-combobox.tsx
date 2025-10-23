'use client'

import * as React from "react";
import { cn } from "@/lib/utils/utils";
import { Check, X, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

export interface Option {
    value: string;
    label: string;
}

interface MultiSelectProps {
    options: Option[];
    selected: string[];
    onChange: (selected: string[]) => void;
    className?: string;
    placeholder?: string;
}

const MultiSelectCombobox = React.forwardRef<HTMLButtonElement, MultiSelectProps>(({ options, selected, onChange, className, placeholder = "Select..." }, ref) => {
    const [open, setOpen] = React.useState(false);

    const handleSelect = (value: string) => {
        const newSelected = selected.includes(value)
            ? selected.filter((item) => item !== value)
            : [...selected, value];
        onChange(newSelected);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    ref={ref}
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn("w-full justify-between h-auto", className)}
                >
                    <div className="flex gap-1 flex-wrap">
                        {selected.length > 0 ? (
                            options
                                .filter(option => selected.includes(option.value))
                                .map(option => (
                                    <Badge
                                        variant="secondary"
                                        key={option.value}
                                        className="mr-1"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleSelect(option.value);
                                        }}
                                    >
                                        {option.label}
                                        <X className="ml-1 h-3 w-3" />
                                    </Badge>
                                ))
                        ) : (
                            <span>{placeholder}</span>
                        )}
                    </div>
                    <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                    <CommandInput placeholder="Search..." />
                    <CommandList>
                        <CommandEmpty>No results found.</CommandEmpty>
                        <CommandGroup>
                            {options.map((option) => (
                                <CommandItem
                                    key={option.value}
                                    onSelect={() => handleSelect(option.value)}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            selected.includes(option.value) ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {option.label}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
});

MultiSelectCombobox.displayName = 'MultiSelectCombobox';

export { MultiSelectCombobox };
