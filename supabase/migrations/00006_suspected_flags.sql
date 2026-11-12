-- transaction_is_suspicious: flags the whole transaction
alter table report_transactions
  add column if not exists is_suspicious boolean not null default false;

-- is_suspected: flags the from/to/conductor party on a transaction
alter table transaction_parties
  add column if not exists is_suspected boolean not null default false;

-- is_suspected: flags a person or entity in a SAR report_party
alter table report_persons
  add column if not exists is_suspected boolean not null default false;

alter table report_entities
  add column if not exists is_suspected boolean not null default false;
