'use client'

import {
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription, 
    DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CreateEventRequest } from "@/types/event";

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    eventData: Partial<CreateEventRequest>;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, eventData }) => {
    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Confirm Event Creation</DialogTitle>
                    <DialogDescription>
                        Please review the event details before confirming.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div>
                        <h3 className="font-semibold">Event Details</h3>
                        <p><strong>Name:</strong> {eventData.eventName}</p>
                        <p><strong>Code:</strong> {eventData.eventCode}</p>
                        <p><strong>Type:</strong> {eventData.typeName}</p>
                        <p><strong>Start:</strong> {eventData.eventStart ? new Date(eventData.eventStart).toLocaleString() : 'N/A'}</p>
                        <p><strong>End:</strong> {eventData.eventEnd ? new Date(eventData.eventEnd).toLocaleString() : 'N/A'}</p>
                    </div>
                    <div>
                        <h3 className="font-semibold">Ticketing</h3>
                        {eventData.ticketTiers?.map((tier, index) => (
                            <p key={index}>{tier.tierName}: {tier.totalQuantity} @ ${tier.price}</p>
                        ))}
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={onConfirm}>Confirm</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};