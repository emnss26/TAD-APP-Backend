const buildCustomAttributeValueMap = (attributeDefinitions) => {
    const valueMap = {};
  
    attributeDefinitions.forEach(def => {
      if (
        def.metadata &&
        def.metadata.list &&
        Array.isArray(def.metadata.list.options)
      ) {
        const optionsMap = {};
        def.metadata.list.options.forEach(option => {
          optionsMap[option.id] = option.value;
        });
        valueMap[def.id] = optionsMap;
      }
    });
  
    return valueMap;
  };
  
  const enrichCustomAttributes = (issues, attributeValueMap) => {
    return issues.map(issue => {
      if (!Array.isArray(issue.customAttributes)) return issue;
  
      const enrichedAttributes = issue.customAttributes.map(attr => {
        const readableValue = attributeValueMap?.[attr.attributeDefinitionId]?.[attr.value];
        return {
          ...attr,
          readableValue: readableValue || attr.value,
        };
      });
  
      return {
        ...issue,
        customAttributes: enrichedAttributes,
      };
    });
  };
  
  module.exports = {
    buildCustomAttributeValueMap,
    enrichCustomAttributes,
  };