import { HttpClient } from '@angular/common/http';
import { Component, Input, OnInit } from '@angular/core';
import { environment } from 'environments/environment';
import { firstValueFrom } from 'rxjs';

/** The VocabularyTooltipComponent class is responsible for fetching and displaying keyword definitions
 based on a list of keywords provided as input. */
@Component({
  selector: 'app-vocabulary-tooltip',
  templateUrl: 'vocabularyTooltip.component.html',
  styleUrls: ['vocabularyTooltip.component.scss'],
})
export class VocabularyTooltipComponent implements OnInit {
  /** The `@Input() keywords: string = '';` line is defining an input property called `keywords` of type
   `string` in the `VocabularyTooltipComponent` class. The `@Input()` decorator allows the property to
   receive input values from its parent component. The `= ''` part is assigning a default value of an
   empty string to the `keywords` property. */
  @Input() keywords: string = '';

  /** The `@Input() separator: string = ';'` line is defining an input property called `separator` of type
   `string` in the `VocabularyTooltipComponent` class. The `@Input()` decorator allows the property to
   receive input values from its parent component. The `= ';'` part is assigning a default value of a
   semicolon (`;`) to the `separator` property. This property is used to specify the separator
   character that will be used to split the `keywords` input string into an array of individual
   keywords. */
  @Input() separator: string = ';';

  /** The line `public results: Array<Keyword> = [];` is declaring a public property called `results` of
   type `Array<Keyword>` in the `VocabularyTooltipComponent` class. It initializes the `results`
   property with an empty array. */
  public results: Array<Keyword> = [];

  /** The line `private _queryKeywords: string = '';` is declaring a private property called
   `_queryKeywords` of type `string` in the `VocabularyTooltipComponent` class. It initializes the
   `_queryKeywords` property with an empty string. This property is used to store the formatted
   keywords that will be used in the SPARQL query to fetch the keyword definitions. */
  private _queryKeywords: string = '';

  /** The `private query` variable is a string that represents the SPARQL query used to fetch keyword
   definitions from a vocabulary endpoint. It is constructed by concatenating the
   `environment.vocabularyEndpoint` value with the query string. */

  // Original Query - If you want to make some test with this original one, remember to replace the occurences of the 'normalizedLabel' variable with 'label'.
  /* private query = environment.vocabularyEndpoint + '?query=prefix%20rdf%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2F1999%2F02%2F22-rdf-syntax-ns%23%3E%0Aprefix%20rdfs%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2F2000%2F01%2Frdf-schema%23%3E%0Aprefix%20owl%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2F2002%2F07%2Fowl%23%3E%0Aprefix%20xsd%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2F2001%2FXMLSchema%23%3E%0Aprefix%20dct%3A%20%3Chttp%3A%2F%2Fpurl.org%2Fdc%2Fterms%2F%3E%0Aprefix%20foaf%3A%20%3Chttp%3A%2F%2Fxmlns.com%2Ffoaf%2F0.1%2F%3E%0Aprefix%20skos%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2F2004%2F02%2Fskos%2Fcore%23%3E%0Aprefix%20version%3A%20%3Chttp%3A%2F%2Fpurl.org%2Flinked-data%2Fversion%23%3E%0Aprefix%20ldp%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2Fns%2Fldp%23%3E%0Aprefix%20time%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2F2006%2Ftime%23%3E%0Aprefix%20reg%3A%20%3Chttp%3A%2F%2Fpurl.org%2Flinked-data%2Fregistry%23%3E%0Aprefix%20ui%3A%20%3Chttp%3A%2F%2Fpurl.org%2Flinked-data%2Fregistry-ui%23%3E%0Aprefix%20qb%3A%20%3Chttp%3A%2F%2Fpurl.org%2Flinked-data%2Fcube%23%3E%0Aprefix%20org%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2Fns%2Forg%23%3E%0A%0A%0ASELECT%20DISTINCT%20%3Flabel%20%3Fdefinition%20WHERE%20%7B%20%3Fterm%20rdfs%3Alabel%20%3Flabel%20.%20OPTIONAL%20%7B%20%3Fterm%20dct%3Adescription%20%3Fdefinition%20.%20%7D%20FILTER%20(str(%3Flabel)%20IN%20(listOfTerm))%20%7D&output=json'; */

  // Previous Query Version
  /* private query = environment.vocabularyEndpoint + '?query=PREFIX%20rdf%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2F1999%2F02%2F22-rdf-syntax-ns%23%3E%0APREFIX%20rdfs%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2F2000%2F01%2Frdf-schema%23%3E%0APREFIX%20owl%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2F2002%2F07%2Fowl%23%3E%0APREFIX%20xsd%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2F2001%2FXMLSchema%23%3E%0APREFIX%20dct%3A%20%3Chttp%3A%2F%2Fpurl.org%2Fdc%2Fterms%2F%3E%0APREFIX%20foaf%3A%20%3Chttp%3A%2F%2Fxmlns.com%2Ffoaf%2F0.1%2F%3E%0APREFIX%20skos%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2F2004%2F02%2Fskos%2Fcore%23%3E%0APREFIX%20version%3A%20%3Chttp%3A%2F%2Fpurl.org%2Flinked-data%2Fversion%23%3E%0APREFIX%20ldp%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2Fns%2Fldp%23%3E%0APREFIX%20time%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2F2006%2Ftime%23%3E%0APREFIX%20reg%3A%20%3Chttp%3A%2F%2Fpurl.org%2Flinked-data%2Fregistry%23%3E%0APREFIX%20ui%3A%20%3Chttp%3A%2F%2Fpurl.org%2Flinked-data%2Fregistry-ui%23%3E%0APREFIX%20qb%3A%20%3Chttp%3A%2F%2Fpurl.org%2Flinked-data%2Fcube%23%3E%0APREFIX%20org%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2Fns%2Forg%23%3E%0A%0ASELECT%20DISTINCT%20%28SAMPLE%28%3Flabel%29%20AS%20%3FnormalizedLabel%29%20%28SAMPLE%28%3FdefinitionInner%29%20AS%20%3Fdefinition%29%20WHERE%20%7B%0A%20%20%7B%0A%20%20%20%20SELECT%20%3Flabel%20%3FdefinitionInner%20WHERE%20%7B%0A%20%20%20%20%20%20%3Fterm%20rdfs%3Alabel%20%3Flabel.%0A%20%20%20%20%20%20OPTIONAL%20%7B%20%3Fterm%20dct%3Adescription%20%3FdefinitionInner.%20%7D%0A%20%20%20%20%20%20FILTER%20%28LCASE%28str%28%3Flabel%29%29%20IN%20%28listOfTerm%29%29%0A%20%20%20%20%7D%0A%20%20%7D%0A%7D%20GROUP%20BY%20LCASE%28%3Flabel%29%0A&output=json'; */

  // Current Query Being Used
  private query = `PREFIX rdf:  <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
                     PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
                     PREFIX owl:  <http://www.w3.org/2002/07/owl#>
                     PREFIX xsd:  <http://www.w3.org/2001/XMLSchema#>
                     PREFIX dct:  <http://purl.org/dc/terms/>
                     PREFIX foaf: <http://xmlns.com/foaf/0.1/>
                     PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
                     PREFIX version: <http://purl.org/linked-data/version#>
                     PREFIX ldp: <http://www.w3.org/ns/ldp#>
                     PREFIX time: <http://www.w3.org/2006/time#>
                     PREFIX reg: <http://purl.org/linked-data/registry#>
                     PREFIX ui: <http://purl.org/linked-data/registry-ui#>
                     PREFIX qb: <http://purl.org/linked-data/cube#>
                     PREFIX org: <http://www.w3.org/ns/org#>
                     SELECT DISTINCT
                     (SAMPLE(?label) AS ?normalizedLabel)
                     (SAMPLE(?definitionInner) AS ?definition)
                     WHERE {
                     VALUES ?labelLower {
                     listOfTerm
                     }
                     ?term rdfs:label ?label .
                     FILTER(LCASE(STR(?label)) = ?labelLower)
                     OPTIONAL {
                       ?term dct:description ?definitionInner .
                     }
                     }
                     GROUP BY LCASE(?label)`;

  constructor(private readonly http: HttpClient) {}

  // groupKeywords() function to group keywords in arrays of MAX length 3
  public groupKeywords = (termsArray: string[], groupSize: number): string[][] => {
    const groupedArray: string[][] = [];
    for (let i = 0; i < termsArray.length; i += groupSize) {
      groupedArray.push(termsArray.slice(i, i + groupSize));
    }
    return groupedArray;
  };

  /**
   * The ngOnInit function takes a string of keywords, splits them using a separator, and then performs
   * a SparkQL query to retrieve definitions for each keyword, which are then stored in an array of
   * results.
   */
  ngOnInit(): void {
    const keywordsArray = this.keywords.split(this.separator);

    keywordsArray.forEach((_k: string, index: number) => {
      this._queryKeywords += '"' + _k.trim() + '"';
      this.results.push({
        keyword: _k.trim(),
        definition: '',
      });
      if (index < keywordsArray.length - 1) {
        this._queryKeywords += ', ';
      }
    });

    // splitting the string containing all keywords in individual keywords and removing heading and trailing spaces
    const termsArray: string[] = this._queryKeywords.split(',').map((term) => term.trim());

    // grouping individual keywords in array of MAX length 3
    const groupedKeywords = this.groupKeywords(termsArray, 3);

    let listOfTerm: string = '';

    // call SparkQL query ex: SELECT DISTINCT ?label ?definition
    // WHERE { ?term rdfs:label ?label . OPTIONAL { ?term dct:description ?definition . }
    // FILTER (str(?label) IN ("earthquake", "seismic waveform")) }

    groupedKeywords.forEach((item: string[], outerIndex: number) => {
      item.forEach((keyword: string, innerIndex: number) => {
        listOfTerm += keyword;
        if (innerIndex < item.length - 1) {
          listOfTerm += ' '; // blank space to separate VALUES, not comma (SPARQL)
        }
      });
      const encodedQuery = environment.vocabularyEndpoint + '?query=' + encodeURIComponent(this.query) + '&output=json';
      // making a request each 3 keywords
      void firstValueFrom(this.http.get(encodedQuery.replace(/listOfTerm/g, listOfTerm)))
        .then((value: JsonResponse) => {
          if (value.results.bindings.length > 0) {
            value.results.bindings.forEach((_key: KeyWordObject) => {
              if (_key.definition !== undefined) {
                this.results.map((_v: Keyword) => {
                  if (_v.keyword.toLowerCase() === _key.normalizedLabel.value.toLowerCase()) {
                    _v.definition = _key.definition.value;
                  }
                });
              }
            });
          }
        })
        .catch((e) => {
          console.log(e, 'API vocabulary error');
        });
      listOfTerm = '';
    });
  }
}

/** The `interface Keyword {` is defining an interface called `Keyword`. An interface in TypeScript is a
 way to define the structure of an object. In this case, the `Keyword` interface specifies that an
 object of type `Keyword` should have two properties: `keyword` of type `string` and `definition` of
 type `string`. This interface is used to define the structure of the objects stored in the `results`
 array in the `VocabularyTooltipComponent` class. */
interface Keyword {
  keyword: string;
  definition: string;
}

/** The `interface JsonResponse` is defining the structure of the JSON response object that is expected
 to be returned from the SPARQL query. It specifies that the response object should have a property
 called `results` which is an object with a property called `bindings` that is an array of objects.
 Each object in the `bindings` array should have properties called `label` and `definition`, both of
 which are objects with properties `type` and `value`. This interface is used to provide type
 information and ensure that the response object is correctly structured when accessing its
 properties in the code. */
interface JsonResponse {
  results: {
    bindings: Array<KeyWordObject>;
  };
}

/** The `interface KeyWordObject` is defining the structure of an object that represents a keyword and
 its definition in the JSON response from the SPARQL query. It specifies that the object should have
 two properties: `label` and `definition`, both of which are objects with properties `type` and
 `value`. The `type` property represents the data type of the value, and the `value` property
 represents the actual value of the keyword or definition. This interface is used to provide type
 information and ensure that the keyword objects in the JSON response are correctly structured when
 accessing their properties in the code. */
interface KeyWordObject {
  normalizedLabel: ResponseObject;
  definition: ResponseObject;
}

/** The `interface ResponseObject` is defining the structure of an object that represents a response
 from the SPARQL query. It specifies that the object should have two properties: `type` and `value`.
 The `type` property represents the data type of the value, and the `value` property represents the
 actual value of the response. This interface is used to provide type information and ensure that the
 response objects in the code are correctly structured when accessing their properties. */
interface ResponseObject {
  type: string;
  value: string;
}
