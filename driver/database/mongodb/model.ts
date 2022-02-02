export const model = (schema: any) => {
  schema.statics.paginate = async function( this: typeof schema, {
    page = 1,
    limit = 10,
    sort = '-created_at',
    populate = [],
    q = {}
  }) {
    var result = this.find(q);

    if (populate.length) {
      populate.forEach(function (pop) {
        result.populate(pop.populate);
      });
    }

    result.select('-__v')
      .skip((page - 1) * limit)
      .limit(limit)
      .sort(sort)
      .lean({ virtuals: true })
      .exec();

    return result;
  };

  schema.statics.lookup = function(this: typeof schema, {
    // page = 1,
    // limit = 10,
    // sort = '-created_at',
    populate = [],
    q = {}
  }) {
    let result = this.aggregate([...populate]);
    if (q) {
      result.match(q);
    }
    return result.exec();
  };

  schema.add({
    created_by: {
      type: String
    },
    created_by_name: {
      type: String
    },
    updated_by: {
      type: String
    },
    updated_by_name: {
      type: String
    },
    created_by_admin: {
      type: String
    },
    created_by_admin_name: {
      type: String
    },
    updated_by_admin: {
      type: String
    },
    updated_by_admin_name: {
      type: String
    }
  });

  schema.statics.getOne = function(this: typeof schema, q = {}, populate: any[] = []) {
    var result = this.findOne(q).select('-__v');

    if (populate.length) {
      populate.forEach(function (pop) {
        result.populate(pop.populate);
      });
    }

    result.lean({ virtuals: true }).exec();

    return result;
  };

  schema.pre('update', function(this: typeof schema) {
    this.update({}, { $inc: { __v: 1 } });
  });
};
