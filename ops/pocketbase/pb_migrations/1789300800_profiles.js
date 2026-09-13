/// <reference path="../pb_data/types.d.ts" />
//
// Creates the `profiles` collection: one opaque profile blob per user account,
// with an optimistic `version`.
//
// Verified against PocketBase v0.40.4 (JS migrations have existed since v0.23).
//
// Every write goes through POST /api/app/profile (pb_hooks/main.pb.js), which saves
// via $app and therefore bypasses API rules. Create/update are therefore `null`
// (superusers only). Note that the spec's "@request.auth.id = \"\"" would have been
// wrong: that expression is TRUE for a guest, so it would have allowed anonymous writes.

migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users');

    const collection = new Collection({
      type: 'base',
      name: 'profiles',

      // Reads are scoped to the owner. A token belonging to another account sees an
      // empty list rather than a 403, which leaks nothing.
      listRule: 'user = @request.auth.id',
      viewRule: 'user = @request.auth.id',

      // Direct writes are denied: the hook is the only write path.
      // (For reference, the rule-only variant of the optimistic check would be
      //  "user = @request.auth.id && @request.body.version > version" — supported
      //  in v0.40.4, but it cannot return a distinguishable 409.)
      createRule: null,
      updateRule: null,

      // The owner may delete their own server-side copy (privacy escape hatch).
      deleteRule: 'user = @request.auth.id',

      fields: [
        {
          type: 'relation',
          name: 'user',
          required: true,
          collectionId: users.id,
          cascadeDelete: true,
          maxSelect: 1,
          minSelect: 0,
        },
        {
          type: 'json',
          name: 'data',
          required: true,
          maxSize: 5242880, // 5 MiB
        },
        {
          type: 'number',
          name: 'version',
          required: true,
          min: 1,
          onlyInt: true,
        },
        {
          type: 'text',
          name: 'updatedBy',
          required: false,
          max: 100,
        },
        {
          type: 'autodate',
          name: 'created',
          onCreate: true,
          onUpdate: false,
        },
        {
          type: 'autodate',
          name: 'updated',
          onCreate: true,
          onUpdate: true,
        },
      ],

      // One profile per account.
      indexes: ['CREATE UNIQUE INDEX `idx_profiles_user` ON `profiles` (`user`)'],
    });

    app.save(collection);
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('profiles');
    app.delete(collection);
  },
);
