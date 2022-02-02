'use strict';

const mongoose = require('mongoose');
const { model } = require('../../../driver/database/mongodb/model');

const { Mixed } = mongoose.SchemaTypes;

const ArticlesSchema = new mongoose.Schema(
  {
    photo: String,
    title: String,
    is_public: Boolean,
    admin_id: String,
    content: Mixed
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  }
);

ArticlesSchema.plugin(model);

const ar = mongoose.model('Articles', ArticlesSchema);
