import {
    DELETE,
    UPDATE,
} from './constants.js';

/**
 * A thin wrapper around an entity to record mutations.
 */
const Entity = class Entity {
    constructor(manager, props) {
        Object.assign(this, {manager}, props);
        this.fieldNames = Object.keys(props);
    }

    getId() {
        return this[this.manager.getIdAttribute()];
    }

    toPlain() {
        const obj = {};
        this.fieldNames.forEach((fieldName) => {
            obj[fieldName] = this[fieldName];
        });
        return obj;
    }

    /**
     * Records a mutation to the Entity instance for a single
     * field value assignment.
     * @param {string} propertyName - name of the property to set
     * @param {*} value - value assigned to the property
     * @return {undefined}
     */
    set(propertyName, value) {
        this.update({[propertyName]: value});
    }

    /**
     * Records a mutation to the Entity instance for multiple field value assignments.
     * @param  {Object} mergeObj - an object that will be merged with this instance.
     * @return {undefined}
     */
    update(mergeObj) {
        Object.assign(this, mergeObj);
        this.manager.mutations.push({
            type: UPDATE,
            payload: {
                idArr: [this.getId()],
                updater: mergeObj,
            },
        });
    }

    /**
     * Records the Entity to be deleted.
     * @return {undefined}
     */
    delete() {
        this.manager.mutations.push({
            type: DELETE,
            payload: [this.getId()],
        });
    }
};

export default Entity;