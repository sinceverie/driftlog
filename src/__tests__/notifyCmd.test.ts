import { parseNotifyArgs } from '../notifyCmd';
import * as notifyMod from '../notify';
import * as loaderMod from '../loader';
import * as differMod from '../differ';

describe('parseNotifyArgs', () => {
  it('parses files and defaults channel to console', () => {
    const args = parseNotifyArgs(['a.env', 'b.env']);
    expect(args.files).toEqual(['a.env', 'b.env']);
    expect(args.channel).toBe('console');
  });

  it('parses --channel webhook and --webhook-url', () => {
    const args = parseNotifyArgs(['a.env', 'b.env', '--channel', 'webhook', '--webhook-url', 'http://example.com']);
    expect(args.channel).toBe('webhook');
    expect(args.webhookUrl).toBe('http://example.com');
  });

  it('parses --output and --min-severity', () => {
    const args = parseNotifyArgs(['a.env', 'b.env', '--output', 'out.json', '--min-severity', 'high']);
    expect(args.outputFile).toBe('out.json');
    expect(args.minSeverity).toBe('high');
  });

  it('parses --channel file', () => {
    const args = parseNotifyArgs(['x.env', 'y.env', '--channel', 'file']);
    expect(args.channel).toBe('file');
  });
});

describe('cmdNotify', () => {
  it('calls notify with computed drift entries', async () => {
    const fakeEntries = [{ key: 'A', kind: 'changed' as const, left: '1', right: '2' }];
    jest.spyOn(loaderMod, 'loadConfigs').mockResolvedValue([
      { label: 'a', data: { A: '1' } },
      { label: 'b', data: { A: '2' } },
    ] as any);
    jest.spyOn(differMod, 'computeDrift').mockReturnValue(fakeEntries);
    const notifySpy = jest.spyOn(notifyMod, 'notify').mockResolvedValue();

    const { cmdNotify } = await import('../notifyCmd');
    await cmdNotify(['a.env', 'b.env', '--channel', 'console']);

    expect(notifySpy).toHaveBeenCalledWith(fakeEntries, expect.objectContaining({ channel: 'console' }));

    jest.restoreAllMocks();
  });

  it('exits with error when fewer than 2 files provided', async () => {
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const { cmdNotify } = await import('../notifyCmd');
    await expect(cmdNotify(['only-one.env'])).rejects.toThrow('exit');
    exitSpy.mockRestore();
  });
});
