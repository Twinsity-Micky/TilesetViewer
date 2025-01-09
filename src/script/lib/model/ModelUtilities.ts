export default class ModelUtilities {
  private static uniqueId = 0;

  public static getUniqueId(prefix = 'id_'): string {
    ModelUtilities.uniqueId++;
    return prefix + ModelUtilities.uniqueId;
  }

}
