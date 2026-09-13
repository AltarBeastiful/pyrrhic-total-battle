/// <reference path="../pb_data/types.d.ts" />
//
// Pyrrhic profile sync — the only write path for the `profiles` collection.
//
// Verified against PocketBase v0.40.4 (see docs/investigations/0012-pocketbase-verification.md).
//
// POST /api/app/profile
//   Authorization: <pocketbase auth token>        (a "Bearer " prefix is accepted too)
//   Body: { "data": <JSON object>, "version": <int >= 1>, "deviceId": <string> }
//
//   200 -> { version, updated }
//   400 -> invalid body
//   401 -> not authenticated
//   409 -> { code: 409, message: "conflict", data: { serverVersion, updated } }
//
// The collection's create/update/delete API rules are locked to superusers only, so this
// handler (which saves through $app and therefore bypasses API rules) owns every write.
// Reads stay on the standard GET /api/collections/profiles/records route.

routerAdd('POST', '/api/app/profile', (e) => {
  const auth = e.auth;
  if (!auth) {
    throw new UnauthorizedError('authentication required');
  }
  if (auth.collection().name !== 'users') {
    throw new ForbiddenError('only user accounts can save a profile');
  }

  // DynamicModel shape values double as the Go types to bind into.
  // `null` is NOT a valid shape value in v0.40 (reflect.TypeOf(nil) panics);
  // use the nullObject() helper for "an arbitrary JSON object".
  const body = new DynamicModel({
    data: nullObject(),
    version: 0,
    deviceId: '',
  });
  e.bindBody(body);

  const version = body.version;
  if (typeof version !== 'number' || !Number.isInteger(version) || version < 1) {
    throw new BadRequestError('invalid version');
  }
  if (body.data === null || body.data === undefined) {
    throw new BadRequestError('missing data');
  }

  const deviceId = String(body.deviceId || '').slice(0, 100);

  let record = null;
  try {
    record = $app.findFirstRecordByFilter('profiles', 'user = {:uid}', {
      uid: auth.id,
    });
  } catch (err) {
    // findFirstRecordByFilter throws sql.ErrNoRows when there is no match.
    record = null;
  }

  // First save for this account.
  if (!record) {
    if (version !== 1) {
      return e.json(409, {
        code: 409,
        message: 'conflict',
        data: { serverVersion: 0, updated: '' },
      });
    }

    const collection = $app.findCollectionByNameOrId('profiles');
    record = new Record(collection);
    record.set('user', auth.id);
    record.set('data', body.data);
    record.set('version', 1);
    record.set('updatedBy', deviceId);
    $app.save(record);

    return e.json(200, {
      version: 1,
      updated: record.getString('updated'),
    });
  }

  const serverVersion = record.getInt('version');
  if (version !== serverVersion + 1) {
    return e.json(409, {
      code: 409,
      message: 'conflict',
      data: {
        serverVersion: serverVersion,
        updated: record.getString('updated'),
      },
    });
  }

  record.set('data', body.data);
  record.set('version', version);
  record.set('updatedBy', deviceId);
  $app.save(record);

  return e.json(200, {
    version: version,
    updated: record.getString('updated'),
  });
});
