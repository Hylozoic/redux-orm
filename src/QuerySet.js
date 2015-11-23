import reject from 'lodash/collection/reject';
import sortByAll from 'lodash/collection/sortByAll';
import Entity from './Entity.js';
import {match} from './utils.js';
import {
    UPDATE,
    DELETE,
} from './constants.js';

/**
 * A chainable class that keeps track of a list of entities and
 *
 * - returns a subset clone of itself with [filter]{@link QuerySet#filter} and [exclude]{@link QuerySet#exclude}
 * - records mutations to entities with [update]{@link QuerySet#update} and [delete]{@link QuerySet#delete}
 *
 */
const QuerySet = class QuerySet {
    /**
     * Creates a QuerySet.
     * @param  {EntityManager} manager - used to keep an internal reference
     *                                   to the EntityManager in use.
     * @param  {number[]} idArr - an array of the id's this QuerySet includes.
     */
    constructor(manager, idArr) {
        Object.assign(this, {
            manager,
            idArr,
        });
    }

    _new(ids) {
        return new QuerySet(this.manager, ids);
    }

    /**
     * Returns an array of the plain entity objects represented by the QuerySet.
     * The `idAttribute` of the entities is included with each entity.
     * @return {Object[]}
     */
    getFullEntities() {
        const idAttribute = this.manager.getIdAttribute();
        return this.idArr.map(id => {
            return Object.assign(
                {[idAttribute]: id},
                this.manager.getEntityMap()[id]);
        });
    }

    /**
     * Returns the number of entities represented by the QuerySet.
     * @return {number} length of the QuerySet
     */
    count() {
        return this.idArr.length;
    }

    /**
     * Checks if QuerySet has any entities.
     * @return {Boolean} `true` if QuerySet contains entities, else `false`.
     */
    exists() {
        return Boolean(this.count());
    }

    _getEntity(entity) {
        return new Entity(this.manager, entity);
    }

    /**
     * Returns the Entity instance at index `index` in the QuerySet.
     * @param  {number} index - index of the entity to get
     * @return {Entity} an Entity instance at index `index` in the QuerySet
     */
    at(index) {
        return this.manager.get({[this.manager.getIdAttribute()]: this.idArr[index]});
    }

    /**
     * Returns the Entity instance at index 0 in the QuerySet.
     * @return {Entity}
     */
    first() {
        return this.at(0);
    }

    /**
     * Returns the Entity instance at index `QuerySet.count() - 1`
     * @return {Entity}
     */
    last() {
        return this.at(this.idArr.length - 1);
    }

    /**
     * Returns a new QuerySet with the same entities.
     * @return {QuerySet} a new QuerySet with the same entities.
     */
    all() {
        return this._new(this.idArr);
    }

    /**
     * Returns a new {@link QuerySet} with entities that match properties in `lookupObj`.
     *
     * @param  {Object} lookupObj - the properties to match entities with.
     * @return {QuerySet} a new {@link QuerySet} with entities that passed the filter.
     */
    filter(lookupObj) {
        const fullEntities = this.getFullEntities();
        let entities;

        if (typeof lookupObj === 'function') {
            entities = fullEntities.filter(lookupObj);
        } else {
            entities = fullEntities.filter(entity => match(lookupObj, entity));
        }
        const newIdArr = entities.map(entity => entity[this.manager.getIdAttribute()]);
        return this._new(newIdArr);
    }

    /**
     * Returns a new {@link QuerySet} with entities that do not match properties in `lookupObj`.
     *
     * @param  {Object} lookupObj - the properties to unmatch entities with.
     * @return {QuerySet} a new {@link QuerySet} with entities that passed the filter.
     */
    exclude(lookupObj) {
        const entities = reject(this.getFullEntities(), entity => match(lookupObj, entity));
        return this._new(entities.map(entity => entity[this.manager.getIdAttribute()]));
    }

    /**
     * Returns a new {@link QuerySet} with entities ordered by `fieldNames` in ascending
     * order.
     * @param  {string[]} fieldNames - the property names to order by.
     * @return {QuerySet} a new {@link QuerySet} with entities ordered by `fieldNames`.
     */
    orderBy(...fieldNames) {
        const entities = sortByAll(this.getFullEntities(), fieldNames);
        return this._new(entities.map(entity => entity[this.manager.getIdAttribute()]));
    }

    /**
     * Records a mutation specified with `updater` to all the entities in the {@link QuerySet}.
     * @param  {Object|function} updater - an object to merge with all the entities in this
     *                                     queryset, or a mapper function that takes the
     *                                     entity as an argument and returns an updated
     *                                     entity.
     * @return {undefined}
     */
    update(updater) {
        this.manager.mutations.push({
            type: UPDATE,
            payload: {
                idArr: this.idArr,
                updater,
            },
        });
    }

    /**
     * Records a deletion of all the entities in this {@link QuerySet}.
     * @return {undefined}
     */
    delete() {
        this.manager.mutations.push({
            type: DELETE,
            payload: this.idArr,
        });
    }
};

export default QuerySet;