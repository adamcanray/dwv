/**
 * Tests for the 'image/spacing.js' file.
 */
// Do not warn if these variables were not defined before.
/* global QUnit */

/**
 * Tests for {@link dwv.image.Spacing}.
 *
 * @function module:tests/image~spacing
 */
QUnit.test('Test Spacing.', function (assert) {
  // bad input
  assert.throws(function () {
    new dwv.image.Spacing();
  },
  new Error('Cannot create spacing with no values.'),
  'spacing with undef values array.');
  assert.throws(function () {
    new dwv.image.Spacing(null);
  },
  new Error('Cannot create spacing with no values.'),
  'spacing with null values array.');
  assert.throws(function () {
    new dwv.image.Spacing([]);
  },
  new Error('Cannot create spacing with empty values.'),
  'spacing with empty values array.');
  assert.throws(function () {
    new dwv.image.Spacing([2, 2, 0]);
  },
  new Error('Cannot create spacing with non number or zero values.'),
  'spacing with zero values.');
  assert.throws(function () {
    new dwv.image.Spacing([2, undefined, 2]);
  },
  new Error('Cannot create spacing with non number or zero values.'),
  'spacing with undef values.');
  assert.throws(function () {
    new dwv.image.Spacing([2, 'a', 2]);
  },
  new Error('Cannot create spacing with non number or zero values.'),
  'spacing with string values.');

  var spacing01 = new dwv.image.Spacing([2, 3, 4]);
  // test its values
  assert.equal(spacing01.get(0), 2, 'getColumnSpacing');
  assert.equal(spacing01.get(1), 3, 'getRowSpacing');
  assert.equal(spacing01.get(2), 4, 'getSliceSpacing');
  // equality
  assert.equal(spacing01.equals(null), false, 'equals null false');
  assert.equal(spacing01.equals(), false, 'equals undefined false');
  var spacing02 = new dwv.image.Spacing([2, 3]);
  assert.equal(spacing01.equals(spacing02), false,
    'equals different length false');

  assert.equal(spacing01.equals(spacing01), 1, 'equals self true');
  var spacing03 = new dwv.image.Spacing([2, 3, 4]);
  assert.equal(spacing01.equals(spacing03), 1, 'equals true');
  var spacing04 = new dwv.image.Spacing([3, 3, 4]);
  assert.equal(spacing01.equals(spacing04), 0, 'equals false');

});
