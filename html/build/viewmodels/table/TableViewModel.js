import { obervable, computed, extendObservable } from "mobx";

import { getPeople, getEvents, getCategories, onEventsChange, getExpendituresTotal, getIousTotal } from "../../db/database";
import { getAmountDisplay } from "../util";

import { InputDialogModel } from "./InputDialogModel";

export let TableViewModel = class TableViewModel {

    constructor() {

        extendObservable(this, {
            people: [],
            events: [],
            categories: [],
            queryingMoreEvents: false,
            iouPairs: computed(() => {
                var pairs = [];
                this.people.forEach(borrower => {
                    this.people.forEach(creditor => {
                        if (borrower.name < creditor.name) {
                            pairs.push([borrower, creditor]);
                        }
                    });
                });
                return pairs;
            }),
            expendituresTotals: [],
            iousTotals: []
        });
        this.inputDialog = new InputDialogModel(this);
        this.queryEvents();
        this.queryPeople();
        this.queryCategories();
        this.queryExpendituresTotal();
        this.queryIousTotal();

        onEventsChange(() => {
            this.requeryEvents();
            this.queryExpendituresTotal();
            this.queryIousTotal();
        });
    }

    queryEvents() {
        getEvents(0, 20).then(events => {
            this.events.replace(events.map(e => new Event(e, this)));
            this.queryMoreEvents();
        });
    }

    queryMoreEvents() {
        if (!this.queryingMoreEvents) {

            this.queryingMoreEvents = true;
            //console.log('querying more events');
            getEvents(this.events.length, 20).then(events => {

                this.events = this.events.concat(events.map(e => new Event(e, this)));
                this.queryingMoreEvents = false;
            });
        }
    }

    requeryEvents() {
        getEvents(0, this.events.length).then(events => {
            this.events.replace(events.map(e => new Event(e, this)));
        });
    }

    queryPeople() {
        getPeople().then(people => {
            this.people = people;
        });
    }

    queryCategories() {
        getCategories().then(categories => {
            this.categories = categories;
        });
    }

    queryExpendituresTotal() {
        getExpendituresTotal().then(totals => {
            this.expendituresTotals.replace(totals);
        });
    }

    queryIousTotal() {
        getIousTotal().then(totals => {
            this.iousTotals.replace(totals);
        });
    }

    getCategory(name) {
        return this.categories.find(x => x.name == name);
    }

    getExpendituresTotal(name) {
        const total = this.expendituresTotals.find(x => x.person === name);
        return total ? getAmountDisplay(total.value) : undefined;
    }

    getIousTotal(borrower, creditor) {
        const total = this.iousTotals.find(x => x.borrower === borrower && x.creditor === creditor);
        return total ? getAmountDisplay(total.value) : undefined;
    }

};

export let Event = class Event {
    constructor(data, parent) {
        this.parent = parent;
        extendObservable(this, Object.assign(data, {
            categoryFullName: computed(() => {
                const cat = this.parent.getCategory(this.category);
                return cat ? cat.fullName : this.category;
            }),
            amountDisplay: computed(() => {
                return getAmountDisplay(this.amount);
            })
        }));
    }

};