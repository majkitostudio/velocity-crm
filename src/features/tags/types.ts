export type ContactTagView = {
  id: string;
  name: string;
};

export type ContactTagsPanelView = {
  contactId: string;
  tags: ContactTagView[];
  availableTags: ContactTagView[];
  canManageTags: boolean;
};
