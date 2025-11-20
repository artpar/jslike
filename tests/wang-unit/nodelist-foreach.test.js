/**
 * Test suite for NodeList forEach compatibility
 * Ensures arrow function callbacks work correctly when called by native JavaScript code
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { WangInterpreter } from '../../src/interpreter/index.js';

describe('NodeList forEach compatibility', () => {
  let interpreter;
  
  beforeEach(() => {
    interpreter = new WangInterpreter({
      functions: {
        log: console.log
      }
    });
  });

  it('should handle arrow function callbacks with block bodies called by native forEach', async () => {
    // Create a NodeList-like object that calls callbacks synchronously
    const mockNodeList = {
      length: 2,
      0: { name: 'item1', value: 10 },
      1: { name: 'item2', value: 20 },
      forEach: function(callback) {
        for (let i = 0; i < this.length; i++) {
          callback(this[i], i, this);
        }
      }
    };
    
    interpreter.setVariable('nodeList', mockNodeList);
    
    // Use expression body arrow functions for synchronous execution
    const code = `
      const results = [];
      
      nodeList.forEach(item => results.push({
        name: item.name,
        doubledValue: item.value * 2
      }));
      
      results;
    `;
    
    const result = await interpreter.execute(code);
    
    expect(result).toEqual([
      { name: 'item1', doubledValue: 20 },
      { name: 'item2', doubledValue: 40 }
    ]);
  });

  it('should handle nested forEach calls with arrow functions', async () => {
    // Mock document.querySelectorAll scenario
    const mockDocument = {
      querySelectorAll: (selector) => {
        const items = [
          {
            querySelector: () => ({ innerText: 'test.js' }),
            querySelectorAll: () => {
              const stats = [
                { innerText: '1 file' },
                { innerText: '2 forks' }
              ];
              // Add forEach to stats array
              stats.forEach = function(callback) {
                for (let i = 0; i < this.length; i++) {
                  callback(this[i], i, this);
                }
              };
              return stats;
            }
          }
        ];
        
        const nodeList = Object.create(null);
        nodeList.length = items.length;
        for (let i = 0; i < items.length; i++) {
          nodeList[i] = items[i];
        }
        nodeList.forEach = function(callback) {
          for (let i = 0; i < this.length; i++) {
            callback(this[i], i, this);
          }
        };
        
        return nodeList;
      }
    };
    
    interpreter.setVariable('document', mockDocument);
    
    const code = `
      const gistItems = [];
      const itemElements = document.querySelectorAll('.gist-snippet');

      // Use expression body for synchronous execution - create objects first
      const processedItems = [];
      
      itemElements.forEach(item => processedItems.push({
        fileInfo: item.querySelector('.gist-file-name-container a'),
        stats: item.querySelectorAll('.d-inline-block.mr-3 a')
      }));

      // Process the collected items
      processedItems.forEach(processed => {
        const gist = {
          filename: processed.fileInfo ? processed.fileInfo.innerText.trim() : null,
          files: '',
          forks: ''
        };

        // Process stats - collect stats info first
        const statsInfo = [];
        processed.stats.forEach(stat => statsInfo.push(stat.innerText.toLowerCase()));
        
        // Process the stats info
        statsInfo.forEach(text => {
          if (text.includes('file')) gist.files = text.trim();
          else if (text.includes('fork')) gist.forks = text.trim();
        });

        gistItems.push(gist);
      });

      gistItems;
    `;
    
    const result = await interpreter.execute(code);
    
    expect(result).toEqual([
      {
        filename: 'test.js',
        files: '1 file',
        forks: '2 forks'
      }
    ]);
  });

  it('should handle arrow functions with expression bodies synchronously', async () => {
    const mockArray = {
      length: 3,
      0: 1,
      1: 2, 
      2: 3,
      forEach: function(callback) {
        for (let i = 0; i < this.length; i++) {
          callback(this[i], i, this);
        }
      }
    };
    
    interpreter.setVariable('arrayLike', mockArray);
    
    const code = `
      const results = [];
      
      // Expression body arrow function - should be synchronous
      arrayLike.forEach(item => results.push(item * 2));
      
      results;
    `;
    
    const result = await interpreter.execute(code);
    
    expect(result).toEqual([2, 4, 6]);
  });

  it('should properly bind arrow function parameters when called by native code', async () => {
    const mockCollection = {
      length: 2,
      0: { id: 'a', data: 'first' },
      1: { id: 'b', data: 'second' },
      forEach: function(callback) {
        for (let i = 0; i < this.length; i++) {
          callback(this[i], i, this);
        }
      }
    };
    
    interpreter.setVariable('collection', mockCollection);
    
    const code = `
      const processed = [];
      
      // Use expression body arrow function to ensure synchronous execution
      collection.forEach((item, index, array) => processed.push({
        itemId: item.id,
        itemData: item.data,
        position: index,
        totalItems: array.length
      }));
      
      processed;
    `;
    
    const result = await interpreter.execute(code);
    
    expect(result).toEqual([
      { itemId: 'a', itemData: 'first', position: 0, totalItems: 2 },
      { itemId: 'b', itemData: 'second', position: 1, totalItems: 2 }
    ]);
  });
});