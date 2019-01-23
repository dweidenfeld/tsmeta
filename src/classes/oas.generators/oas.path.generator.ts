import { Parameter, PathItem } from 'oasmodel'
import { GetMappedAnnotation, SetAnnoationsMapping } from '../../lib/annotations.mapping'
import { MappingAnnotations } from '../../lib/mapping.annotation.enum'
import { OasConfig } from '../../lib/tsmeta.config'
import { TsDecorator, TsMethod } from '../../lib/tsmeta.schema'
import { OasOperationGenerator } from './oas.operation.generator'

/**
 * class OasPathGenerator
 */
class OasPathGenerator {

  private oasOperationGeneration: OasOperationGenerator

  constructor(private oasConfig: OasConfig) {}

  /**
   * generated PathItem
   */
  public generate(
      controllerName: string,
      controllerPath: string,
      tsMethod: TsMethod,
      controllerParameters: Parameter[]): { [key: string]: PathItem } {
    SetAnnoationsMapping(this.oasConfig.annotationsMap)
    const pathItem: { [key: string]: PathItem } = {}

    const usedMappingAnnotation: string[] = this.combineMappingAnnotations()

    const mappingDecorator: TsDecorator = tsMethod.decorators
      .reduce((prev: TsDecorator, curr: TsDecorator): TsDecorator => (usedMappingAnnotation.includes(curr.name)) ? curr : prev)

    const methodPath: string = mappingDecorator.tsarguments && mappingDecorator.tsarguments.pop().representation
    const fullPath: string = this.createFullPath(controllerPath, methodPath)

    this.oasOperationGeneration = new OasOperationGenerator()

    switch (GetMappedAnnotation(mappingDecorator.name)) {
      case MappingAnnotations.GET.name:
        pathItem[fullPath] = { get: this.oasOperationGeneration.generate(controllerName, tsMethod, controllerParameters) }
        break
      case MappingAnnotations.POST.name:
        pathItem[fullPath] = { post: this.oasOperationGeneration.generate(controllerName, tsMethod, controllerParameters) }
        break
      case MappingAnnotations.PUT.name:
        pathItem[fullPath] = { put: this.oasOperationGeneration.generate(controllerName, tsMethod, controllerParameters) }
        break
      case MappingAnnotations.PATCH.name:
        pathItem[fullPath] = { patch: this.oasOperationGeneration.generate(controllerName, tsMethod, controllerParameters) }
        break
      case MappingAnnotations.DELETE.name:
        pathItem[fullPath] = { delete: this.oasOperationGeneration.generate(controllerName, tsMethod, controllerParameters) }
        break
      case MappingAnnotations.HEAD.name:
        pathItem[fullPath] = { head: this.oasOperationGeneration.generate(controllerName, tsMethod, controllerParameters) }
        break
      // istanbul ignore next
      default:
    }

    return pathItem
  }

  /**
   * combined set mapping annotations to string array
   */
  private combineMappingAnnotations(): string[] {
    const usedMappingAnnotation: string[] = []

    usedMappingAnnotation.push(this.oasConfig.annotationsMap.GetRequest || 'GetRequest')
    usedMappingAnnotation.push(this.oasConfig.annotationsMap.PostRequest || 'PostRequest')
    usedMappingAnnotation.push(this.oasConfig.annotationsMap.PutRequest || 'PutRequest')
    usedMappingAnnotation.push(this.oasConfig.annotationsMap.PatchRequest || 'PatchRequest')
    usedMappingAnnotation.push(this.oasConfig.annotationsMap.DeleteRequest || 'DeleteRequest')
    usedMappingAnnotation.push(this.oasConfig.annotationsMap.HeadRequest || 'HeadRequest')

    return usedMappingAnnotation
  }

  /**
   * create full pathing
   */
  private createFullPath(controllerPath: string, methodPath: string): string {
    const controllerPathArray: string[] = controllerPath .split('/').filter((part: string) => part !== '')
    const methodPathArray: string[] = methodPath .split('/').filter((part: string) => part !== '')

    let fullPathArray: string[] = controllerPathArray.concat(methodPathArray)

    fullPathArray = fullPathArray.map((pathString: string) => {
      if (pathString.startsWith(':')) return `{${pathString.replace(':', '')}}` // tslint:disable-line

      return pathString
    })

    return `/${fullPathArray.join('/')}`
  }
}

export { OasPathGenerator }
