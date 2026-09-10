/**
 * Where the patients come from.
 *
 * Six chips, not a database of Pakistan. The list is what a Larkana clinic's
 * queue is actually made of, and the box under it takes anywhere else. It
 * lives here rather than inside the intake screen because the correction box
 * offers the same chips: a city chosen from a chip at the door and retyped by
 * hand at the correction would quietly split one village into two spellings in
 * the figures, which is exactly the sort of thing nobody notices for a year.
 */
export const NEAR = ['Larkana', 'Naudero', 'Ratodero', 'Dokri', 'Bakrani', 'Warah']
