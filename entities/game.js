const GAME = {
  id: 'id',
  name: 'name',
  slug: 'slug',
  release_year: 'release_year',
  description: 'description',

  additionnal_information: 'additionnal_information',
  cover_image: 'cover_image',
  status: 'status',
  classification_id: 'classification_id',
  editor_id: 'editor_id',
  developer_id: 'developer_id',
  author_id: 'author_id',
  created_at: 'created_at',
  updated_at: 'updated_at',
}

const GAME_HISTORY = {
  ...GAME,
  game_id: 'game_id',
  version: 'version',
  game_machine: 'game_machine',
  game_machine_medias: 'game_machine_medias',
  game_types: 'game_types',
  modified_at: 'modified_at',
}

const GAME_MACHINE = {
  id: 'id',
  game_id: 'game_id',
  machine_id: 'machine_id',
  cover_image: 'cover_image',
  author_id: 'author_id',
  created_at: 'created_at',
  updated_at: 'updated_at',
}

const GAME_MACHINE_MEDIA = {
  id: 'id',
  media_id: 'media_id',
  game_id: 'game_id',
  machine_id: 'machine_id',
  created_at: 'created_at',
  updated_at: 'updated_at',
  author_id: 'author_id',
}

const GAME_TAG = {
  id: 'id',
  game_id: 'game_id',
  tag_id: 'tag_id',
  author_id: 'author_id',
  created_at: 'created_at',
  updated_at: 'updated_at',
}

const GAME_TYPE_RELATION = {
  id: 'id',
  game_id: 'game_id',
  type_id: 'type_id',
  author_id: 'author_id',
  created_at: 'created_at',
  updated_at: 'updated_at',
}

module.exports = {
  GAME,
  GAME_HISTORY,
  GAME_MACHINE,
  GAME_MACHINE_MEDIA,
  GAME_TAG,
  GAME_TYPE_RELATION,
}
