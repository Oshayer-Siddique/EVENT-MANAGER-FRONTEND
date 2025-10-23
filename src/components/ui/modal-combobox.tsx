'use client'

import * as React from "react";
import { cn } from "@/lib/utils/utils";
import { Check, X, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

export interface Option {
    value: string;
    label: string;
}

interface ModalComboboxProps {
    options: Option[];
    selected: string[];
    onChange: (selected: string[]) => void;
    className?: string;
    placeholder?: string;
    isMulti?: boolean;
    disabled?: boolean;
}

const ModalCombobox = React.forwardRef<HTMLButtonElement, ModalComboboxProps>(({ options, selected, onChange, className, placeholder = "Select...", isMulti = false, disabled = false }, ref) => {
    const [open, setOpen] = React.useState(false);

    const handleSelect = (value: string) => {
        if (isMulti) {
            const newSelected = selected.includes(value)
                ? selected.filter((item) => item !== value)
                : [...selected, value];
            onChange(newSelected);
        } else {
            onChange([value]);
            setOpen(false);
        }
    };

    const triggerLabel = () => {
        if (selected.length === 0) return placeholder;
        if (isMulti) {
            return options
                .filter(option => selected.includes(option.value))
                .map(option => option.label)
                .join(", ");
        }
        return options.find(option => option.value === selected[0])?.label || placeholder;
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    ref={ref}
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn("w-full justify-between h-auto", className)}
                    disabled={disabled}
                >
                    <div className="flex gap-1 flex-wrap">
                        {isMulti && selected.length > 0 ? (
                            options
                                .filter(option => selected.includes(option.value))
                                .map(option => (
                                    <Badge
                                        variant="secondary"
                                        key={option.value}
                                        className="mr-1"
                                    >
                                        {option.label}
                                    </Badge>
                                ))
                        ) : (
                            <span>{triggerLabel()}</span>
                        )}
                    </div>
                    <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{placeholder}</DialogTitle>
                </DialogHeader>
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
            </DialogContent>
        </Dialog>
    );
});

ModalCombobox.displayName = 'ModalCombobox';

export { ModalCombobox };
