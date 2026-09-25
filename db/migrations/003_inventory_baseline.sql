-- Set all existing inventory rows to the training stock baseline once.
-- Normal order confirmations continue to decrement these quantities.
update inventory
set quantity_available = 100000;
