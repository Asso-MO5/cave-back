const GAME_TYPE = {
  id: 'id',
  name: 'name',
  slug: 'slug',
  description: 'description',
  created_at: 'created_at',
  updated_at: 'updated_at',
  author_id: 'author_id',
}

const GAME_TYPE_HISTORY = {
  ...GAME_TYPE,
  type_id: 'type_id',
  version: 'version',
  modified_at: 'modified_at',
}

module.exports = {
  GAME_TYPE,
  GAME_TYPE_HISTORY,
}
